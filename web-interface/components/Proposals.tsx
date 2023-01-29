import {useForm} from "@mantine/form";
import {Box, Button, Center, Container, NativeSelect, Textarea, TextInput} from "@mantine/core";
import {DatePicker} from "@mantine/dates";
import dayjs from "dayjs";
import {marketDeals} from "../constants";
import { useContract } from './../hooks/useContract';
import { useRouter } from 'next/router';
import { GlobalContext } from "../contexts/GlobalContext";
import { useContext } from "react";
import {BigNumber, ethers} from "ethers";
import {DAO_abi} from "../constants"
import {useSigner} from "wagmi";

export default function Proposals() {
    const {createProposal, isCommpProposed} = useContract()
    const router = useRouter()
    const {data: signer} = useSigner()

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
                    <form onSubmit={form.onSubmit(async(values: any) => {
                        console.log(values.details)
                        const durationInBlocks = dayjs(values.endDateTime).diff(dayjs(new Date()), 'day') * 24 * 60 * 2
                        console.log(durationInBlocks)
                        console.log(values.proposalId)
                        // console log the label corresponding to the value
                        const commP = marketDeals.find((deal) => deal.value === values.proposalId)?.label.slice(-64)
                        console.log(form.values)
                        const address = router.query.address
                        const groupId = router.query.groupId
                        // const isProposedCommp = await isCommpProposed(address,commP)
                        const contract = new ethers.Contract(address, DAO_abi, signer!)
                        console.log(address)
                        if(true){
                            await createProposal(contract,commP,"baga6ea4seaqhzv2fywhelzail4apq4xnlji6zty2ooespk2lnktolg5lse7qgii",durationInBlocks)
                            const res = await orbis.createPost(
                                {
                                    context: `${groupId}`,
                                    body: `${form.values.details}`,
                                    tags: [{
                                        slug: "spatialDAOProposal",
                                        title: "spatialDAOProposal"
                                    },
                                    {
                                        slug: "commpValue",
                                        title: commP
                                    }],
                                }
                            )
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
                            disabled />
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
                            required />
                        <Button color={"pink"} my={"sm"} type={"submit"}>
                            Submit proposal
                        </Button>
                    </form>
                </Container>
            </Center>
        </div>
    )
}