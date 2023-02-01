import {useContract} from "../hooks/useContract";

interface NftCardProps {
    title: string;
    description?: string;
    tokenId: string;
    animationUrl?: string;
    spaceName?: string;
    image?: any;
    setModalOpen?: any;
    setAddAttribute?: any;
    remaining?: string;
    total?: string;
    price?: string;
    streamId: string
}

import {
    Card,
    Text,
    createStyles, Image, ActionIcon, Tooltip, Group, Button, Modal, Center,
} from '@mantine/core';
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import {useIsMounted} from "../hooks/useIsMounted";
import {ethers} from "ethers";
import {DAO_abi} from "../constants";
import {useSigner} from "wagmi";
import {showNotification, updateNotification} from "@mantine/notifications";
import Bounty from "./Bounty";

const useStyles = createStyles((theme) => ({
    card: {
        position: 'relative',
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        maxWidth: 350
    },

    rating: {
        position: 'absolute',
        top: theme.spacing.xs,
        right: theme.spacing.xs + 2,
        pointerEvents: 'none',
    },

    title: {
        display: 'block',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xs / 2,
    },

    action: {
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        ...theme.fn.hover({
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
        }),
    },

    footer: {
        marginTop: theme.spacing.md,
    },
}));

export default function NftCard({
                                    title: commP,
                                    tokenId: filesize,
                                    animationUrl,
                                    description, streamId
                                }: NftCardProps & Omit<React.ComponentPropsWithoutRef<'div'>, keyof NftCardProps>) {
    const {classes, cx, theme} = useStyles();
    const {data: signer} = useSigner()
    const router = useRouter()
    let address = ""
    if (typeof router.query.address === "string")
        address = router.query.address
    const contract = new ethers.Contract(address, DAO_abi, signer!)
    const {
        isProposalEnded,
        isBountyCreated,
        isValidProposedFile,
        isBountyEnabled,
        vote,
        executeProposal,
        getCommpProposal
    } = useContract()

    const [modalOpen, setModalOpen] = useState(false)
    const [buttons, setButtons] = useState(<Button color={"yellow"} fullWidth>Fetching information</Button>)
    useEffect(() => {
        if (commP && router.query.address && signer) {
            getState()
        }
    }, [commP, router.query.address, signer])

    const getState = async () => {
        const isEnded = await isProposalEnded(contract, commP)
        const commP_ = await getCommpProposal(contract, commP)
        const activeState = commP_[5]
        const isBounty = await isBountyCreated(contract, parseInt(commP_[0]))
        const isValid = await isValidProposedFile(contract, commP)
        const isBountyEnabled_ = await isBountyEnabled(contract, commP)
        console.log("isProposalEnded", isEnded)
        console.log("isBountyCreated", isBounty)
        console.log("isValidProposedFile", isValid)
        console.log("isBountyEnabled", isBountyEnabled_)
        console.log("activeState", activeState)
        if (isEnded === false) {
            // voting
            setButtons(
                <Button.Group sx={{width: "100%"}}>
                    <Button fullWidth color={"green"} onClick={async () => {
                        showNotification({
                            id: "bounty",
                            title: "Creating bounty",
                            message: "Please wait",
                            loading: true,
                            disallowClose: true,
                            autoClose: false,
                        })
                        try {
                            await vote(contract, commP, true)
                            updateNotification({
                                id: "bounty",
                                title: "Success",
                                message: "You voted for this proposal",
                                loading: false,
                                disallowClose: false,
                                autoClose: true,
                            })
                        } catch (e) {
                            console.log(e)
                            updateNotification({
                                id: "bounty",
                                title: "Error",
                                message: "Something went wrong",
                                loading: false,
                                disallowClose: false,
                                autoClose: true,
                                color: "red"
                            })
                        }
                    }}>Upvote</Button>
                    <Button fullWidth color={"red"} onClick={async () => {
                        try {
                            await vote(contract, commP, false)
                            showNotification({
                                title: "Success",
                                message: "You voted against this proposal",
                            })
                        } catch (e) {
                            console.log(e)
                            showNotification({
                                title: "Error",
                                message: "Something went wrong",
                            })
                        }
                    }}>Downvote</Button>
                </Button.Group>)
        } else if (isEnded && activeState) {
            setButtons(<Button color={"grape"} fullWidth onClick={async () => {
                showNotification({
                    id: "bounty",
                    title: "Creating bounty",
                    message: "Please wait",
                    loading: true,
                    disallowClose: true,
                    autoClose: false,
                })
                try {
                    await executeProposal(contract, commP)
                    updateNotification({
                        id: "bounty",
                        title: "Success",
                        message: "You executed the proposal",
                        loading: false,
                        disallowClose: false,
                        autoClose: true,
                    })
                } catch (e) {
                    console.log(e)
                    updateNotification({
                        id: "bounty",
                        color: "red",
                        title: "Failed",
                        message: "Something went wrong",
                        loading: false,
                        disallowClose: false,
                        autoClose: true,
                    })
                }
            }}>Execute Proposal</Button>)
        } else if (isEnded && !isValid) {
            setButtons(<Button color={"red"} fullWidth>Proposal Declined</Button>)
        } else if (isEnded && isValid) {
            setButtons(<Button color={"green"} onClick={() => setModalOpen(true)} fullWidth>Create Bounty</Button>)
        } else if (isEnded && isValid) {
            setButtons(<Button color={"green"} fullWidth>Proposal Passed</Button>)
        } else if (!isBountyEnabled_) {
            setButtons(<Button color={"red"} fullWidth>Bounty disabled</Button>)
        }
    }

    const bountyModal = (
        <Modal
            opened={modalOpen}
            transition="fade"
            transitionDuration={500}
            transitionTimingFunction="ease"
            onClose={() => setModalOpen(false)}
        >
            <Center>
                <Bounty commP={commP} fileSize={filesize} streamId={streamId}/>
            </Center>
        </Modal>
    )

    return (
        <>
            <Card withBorder radius="md" className={cx(classes.card)} m={"md"}>
                <Text className={classes.title} lineClamp={4} weight={500}>
                    {commP}
                </Text>
                <Text size="sm" color="dimmed" lineClamp={4}>
                    {description}
                </Text>
                <Card.Section mt={"md"}>
                    {buttons}
                </Card.Section>
            </Card>
            {bountyModal}
        </>
    );
}