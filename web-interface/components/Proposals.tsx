import {useForm} from "@mantine/form";
import {Box, Button, Center, Container, NativeSelect, Textarea, TextInput} from "@mantine/core";
import {DatePicker} from "@mantine/dates";
import dayjs from "dayjs";
import {marketDeals, stateMarketDeals} from "../constants";
import {useContract} from './../hooks/useContract';
import {useRouter} from 'next/router';
import {GlobalContext} from "../contexts/GlobalContext";
import {useContext} from "react";
import {BigNumber, ethers} from "ethers";
import {DAO_abi} from "../constants"
import {useSigner, useAccount} from "wagmi";
import {showNotification, updateNotification} from "@mantine/notifications";

export default function Proposals() {
    const {createProposal, isCommpProposed, getCommpProposal, checkProposerRole} = useContract()
    const router = useRouter()
    const {data: signer} = useSigner()
    const { address: userWalletAddress } = useAccount()
    // @ts-ignore
    const {orbis} = useContext(GlobalContext)

    const form: any = useForm({
        initialValues: {
            details: '',
            endDateTime: '',
            proposalId: 0,
        },
        validate: {
            // endDateTime: (value) => value < form.values.startDateTime ? "End date must be after start date" : null
        }
    })

    return (
        <div>
            <h1>Proposals</h1>
            <Center sx={{minWidth: 250, maxWidth: 900, width: "70%"}} mx={"auto"}>
                <Container mx={"lg"} my={"md"} sx={{minWidth: 250, maxWidth: 900, width: "70%"}}>
                    <form onSubmit={form.onSubmit(async (values: any) => {
                        showNotification({
                            id: "proposal",
                            title: "Proposal Creating...",
                            message: "Please wait while your proposal is being created",
                            autoClose: false,
                            loading: true,
                            disallowClose: true,
                        })
                        orbis.isConnected().then((res: any) => {
                            if (res === false){
                                alert("Please connect to orbis first")
                                updateNotification({
                                    title: "Bounty Creation Failed",
                                    message: "Please connect to orbis first",
                                    loading: false,
                                    disallowClose: false,
                                    autoClose: true,
                                    color: "red",
                                    id: "proposal"
                                })
                                return
                            }
                        })
                        const durationInBlocks = dayjs(values.endDateTime).diff(dayjs(new Date()), 'day') * 24 * 60 * 2
                        const commP = marketDeals.find((deal) => deal.value === values.proposalId)?.label.slice(-64)
                        let address = ""
                        if (typeof router.query.address === "string")
                            address = router.query.address
                        const groupId = router.query.groupId
                        const contract = new ethers.Contract(address, DAO_abi, signer!)
                        const isProposedCommp = await isCommpProposed(contract, commP!)
                        const isProposer = await checkProposerRole(contract, userWalletAddress!)
                        var array = await getCommpProposal(contract,commP!)
                        var commPID = parseInt(array.proposalID._hex, 16).toString()
                        console.log(isProposedCommp)
                        console.log(isProposer)
                        if (!isProposedCommp && isProposer) {
                            try {
                                await createProposal(contract, commP!, "baga6ea4seaqhzv2fywhelzail4apq4xnlji6zty2ooespk2lnktolg5lse7qgii", durationInBlocks)
                                let fileSize: number
                                // @ts-ignore
                                const fData = stateMarketDeals[values.proposalId];
                                fileSize = fData.Proposal.PieceSize
                                await orbis.createPost(
                                    {
                                        // @ts-ignore
                                        context: groupId?.toLowerCase(),
                                        body: form.values.details,
                                        tags: [{
                                            slug: "spatialDAOProposal",
                                            title: "spatialDAOProposal"
                                            },
                                            {
                                                slug: "commpValue",
                                                title: commP
                                            },
                                            {
                                                slug: "fileSize",
                                                title: fileSize.toString()
                                            },
                                            {
                                                slug: "id",
                                                title: commPID
                                            },
                                            {
                                                slug: "endDate",
                                                title: values.endDateTime.toString()
                                            }
                                        ],
                                    }
                                )
                                updateNotification({
                                    id: "proposal",
                                    title: "Proposal Created",
                                    message: "Your proposal has been created successfully",
                                    loading: false,
                                    disallowClose: false,
                                    autoClose: true,
                                })
                            } catch (e) {
                                console.log(e)
                                updateNotification({
                                    id: "proposal",
                                    title: "Proposal Creation Failed",
                                    message: "Your proposal could not be created",
                                    loading: false,
                                    disallowClose: false,
                                    autoClose: true,
                                })
                            }
                            
                        }
                    })}>
                        <Textarea
                            required
                            label="Details"
                            placeholder="Enter details for the proposal"
                            my={"sm"}
                            {...form.getInputProps('details')} />
                        <TextInput
                            required
                            label="Details IPFS CID"
                            value="baga6ea4seaqhzv2fywhelzail4apq4xnlji6zty2ooespk2lnktolg5lse7qgii"
                            disabled/>
                        <DatePicker
                            placeholder={"End date"}
                            minDate={dayjs(new Date()).toDate()}
                            required
                            my={"sm"}
                            label={"Choose when to end the voting"}
                            {...form.getInputProps('endDateTime')}
                        />
                        <NativeSelect
                            data={marketDeals}
                            onChange={(event) => form.setFieldValue('proposalId', event.currentTarget.value)}
                            label={"Select the piece CID to create the proposal."}
                            required/>
                        <Button variant={"gradient"} gradient={{from: "pink", to: "blue", deg: 110}} my={"sm"} type={"submit"}>
                            Submit proposal
                        </Button>
                    </form>
                </Container>
            </Center>
        </div>
    )
}