import {useForm} from "@mantine/form";
import {Box, Button, Center, Container, NumberInput, TextInput} from "@mantine/core";
import {useContract} from '../hooks/useContract';
import {useRouter} from 'next/router';
import {GlobalContext} from "../contexts/GlobalContext";
import {useContext} from "react";
import {BigNumber, ethers} from "ethers";
import {DAO_abi} from "../constants"
import {useSigner} from "wagmi";
import {showNotification, updateNotification} from "@mantine/notifications";
import dayjs from "dayjs";
import {DatePicker} from "@mantine/dates";

interface BountyProps {
    commP: string
    fileSize: string
    streamId: string
}

export default function Bounty({commP, fileSize, streamId}: BountyProps) {
    const {createBounty} = useContract()
    const router = useRouter()
    const {data: signer} = useSigner()
    let address = ""
    if (typeof router.query.address === "string")
        address = router.query.address
    const contract = new ethers.Contract(address, DAO_abi, signer!)
    const groupId = router.query.groupId


    // @ts-ignore
    const {orbis} = useContext(GlobalContext)
    const form: any = useForm({
        initialValues: {
            details: '',
            numberOfBounties: 0,
            bountyReward: 0,
            numberOfDealDays: ''
        },
        validate: {
            numberOfBounties: (value) => value <= 0 ? "Number of bounties is at least 1" : null,
            bountyReward: (value) => value <= 0 ? "Bounty reward has to be greater than 0" : null,
        }
    })

    return (
        <div>
            <Center sx={{minWidth: 250, maxWidth: 900, width: "70%"}} mx={"auto"}>
                <Container mx={"lg"} my={"md"} sx={{minWidth: 250, maxWidth: 900, width: "70%"}}>
                    <form onSubmit={form.onSubmit(async (values: any) => {
                        showNotification({
                            id: "proposal",
                            title: "Bounty Creating...",
                            message: "Please wait while your bounty is being created",
                            autoClose: false,
                            loading: true,
                            disallowClose: true,
                        })
                        console.log(values)
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
                        try {
                            await createBounty(contract, commP, values.numberOfBounties, values.bountyReward, values.numberOfDealDays, parseInt(fileSize))
                            const res = await orbis.createPost(
                                {
                                    context: `${groupId}`,
                                    body: `${form.values.details}`,
                                    tags: [{
                                        slug: "spatialDAOBounty",
                                        title: "spatialDAOBounty"
                                    },
                                        {
                                            slug: "commpValue",
                                            title: commP
                                        },
                                        {
                                            slug: "bountyReward",
                                            title: values.bountyReward.toString()
                                        },
                                        {
                                            slug: "numberOfBounties",
                                            title: values.numberOfBounties.toString()
                                        },
                                        {
                                            slug: "endDateTime",
                                            title: values.numberOfDealDays.toString()
                                        }
                                    ],
                                }
                            )
                            updateNotification({
                                id: "proposal",
                                title: "Bounty Created",
                                message: "Your bounty has been created successfully",
                                loading: false,
                                disallowClose: false,
                                autoClose: true,
                            })
                        } catch (e) {
                            console.log(e)
                            updateNotification({
                                id: "proposal",
                                title: "Bounty Creation Failed",
                                message: "Your bounty could not be created",
                                loading: false,
                                disallowClose: false,
                                autoClose: true,
                            })
                        }
                    })}>
                        <TextInput
                            required
                            label="Details"
                            placeholder="Enter the details of the bounty"
                            my={"sm"}
                            {...form.getInputProps('details')} />
                        <TextInput value={commP} label={"CommP Value"} required disabled />
                        <NumberInput
                            required
                            label="Number of Bounties"
                            placeholder="Enter the Number of Bounties"
                            my={"sm"}
                            {...form.getInputProps('numberOfBounties')} />
                        <NumberInput
                            required
                            label="Bounty Reward"
                            placeholder="Enter the bounty reward"
                            precision={2}
                            my={"sm"}
                            {...form.getInputProps('bountyReward')} />
                        <NumberInput
                            required
                            label="Number of Deal Days"
                            description={"The number of days the bounty will be active for"}
                            placeholder="Enter the number of deal days"
                            min={160}
                            my={"sm"}
                            {...form.getInputProps('numberOfDealDays')} />
                        <Button color={"pink"} my={"sm"} type={"submit"}>
                            Submit bounty
                        </Button>
                    </form>
                </Container>
            </Center>
        </div>
    )
}