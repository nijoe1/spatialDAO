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


    // @ts-ignore
    const {orbis} = useContext(GlobalContext)
    const form: any = useForm({
        initialValues: {
            numberOfBounties: 0,
            bountyReward: 0,
            minBlocks: 0,
        },
        validate: {
            minBlocks: (value) => value <= 0 ? "Minimum blocks is at least 1" : null,
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
                        try {
                            await createBounty(contract, commP, values.numberOfBounties, values.bountyReward, values.minBlocks, parseInt(fileSize))
                            const res = await orbis.createPost(
                                {
                                    context: `${streamId}`,
                                    body: `${form.values.details}`,
                                    tags: [{
                                        slug: "spatialDAOProposal",
                                        title: "spatialDAOProposal"
                                    },
                                        {
                                            slug: "commpValue",
                                            title: commP
                                        },
                                        {
                                            slug: "proposalId",
                                            title: values.proposalId
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
                    })}>
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
                            precision={2}
                            placeholder="Enter the bounty reward"
                            my={"sm"}
                            {...form.getInputProps('bountyReward')} />
                        <NumberInput
                            required
                            label="Minimum Blocks"
                            description={"The minimum number of blocks that the bounty will be active for. 1 block stays active for 30 seconds"}
                            placeholder="Enter the number of blocks"
                            my={"sm"}
                            {...form.getInputProps('minBlocks')} />
                        <Button color={"pink"} my={"sm"} type={"submit"}>
                            Submit bounty
                        </Button>
                    </form>
                </Container>
            </Center>
        </div>
    )
}