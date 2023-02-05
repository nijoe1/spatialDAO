import {useContract} from "../hooks/useContract";

interface NftCardProps {
    title: string;
    description?: string;
    tokenId: string;
    animationUrl?: string;
    spaceName?: string;
    image?: any;
    setModalOpen?: any;
    streamId: string
    timestamp: number
    endDate: string
}

import {
    Card,
    Text,
    createStyles, Button, Modal, Center, Badge, Image,
} from '@mantine/core';
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import * as dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import {ethers} from "ethers";
import {DAO_abi} from "../constants";
import {useAccount, useSigner} from "wagmi";
import {showNotification, updateNotification} from "@mantine/notifications";
import Bounty from "./Bounty";

dayjs.extend(relativeTime)

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

export default function ProposalCard({
                                    title: commP,
                                    tokenId: filesize,
                                    animationUrl,
                                    description, streamId, timestamp, endDate
                                }: NftCardProps & Omit<React.ComponentPropsWithoutRef<'div'>, keyof NftCardProps>) {
    const {classes, cx, theme} = useStyles();
    const {data: signer} = useSigner()
    const router = useRouter()
    const {address: userWalletAddress} = useAccount()

    let address = ""
    if (typeof router.query.address === "string")
        address = router.query.address
    const contract = new ethers.Contract(address, DAO_abi, signer!)
    const {
        isProposalEnded,
        checkVoterRole,
        checkProposerRole,
        isValidProposedFile,
        vote,
        getCommpProposal,
        getCommpBounty,
        getCommpDeals
    } = useContract()

    const [modalOpen, setModalOpen] = useState(false)
    const [buttons, setButtons] = useState(<Button color={"yellow"} fullWidth>Fetching information</Button>)
    const [badgeText, setBadgeText] = useState("Fetching data")
    const [badgeColor, setBadgeColor] = useState("yellow")

    const time = dayjs.unix(timestamp)
    const ending = Math.floor(new Date(endDate).getTime() / 1000)
    const end = dayjs.unix(ending)
    useEffect(() => {
        if (commP && router.query.address && signer) {
            getState()
        }
    }, [commP, router.query.address, signer])

    const getState = async () => {
        const isEnded = await isProposalEnded(contract, commP)
        const commP_ = await getCommpProposal(contract, commP)
        const getBounty = await getCommpBounty(contract, commP)
        const commpDeals = await getCommpDeals(contract, commP)
        const numBounties = getBounty.numberOfBounties._hex
        const activeState = commP_[5]
        const isValid = await isValidProposedFile(contract, commP)
        const isBountyEnabled_ = getBounty.enabled
        if (isEnded === false) {
            const isVoter = await checkVoterRole(contract, userWalletAddress!)
            const isProposer = await checkProposerRole(contract, userWalletAddress!)
            // voting
            setButtons(
                <Button.Group sx={{width: "100%"}}>
                    <Button fullWidth color={"green.6"} onClick={async () => {
                        if(isVoter || isProposer){
                            showNotification({
                                id: "bounty",
                                title: "casting vote",
                                message: "Please wait",
                                loading: true,
                                disallowClose: true,
                                autoClose: false,
                            })
                            await vote(contract, commP, true)
                            showNotification({
                                id: "bounty",
                                title: "success",
                                message: "Vote casted!",
                                loading: true,
                                disallowClose: true,
                                autoClose: false,
                            })
                        }else{
                            showNotification({
                                id: "bounty",
                                title: "You are not a DAO member",
                                message: "You are not a DAO member",
                                loading: true,
                                disallowClose: true,
                                autoClose: false,
                            })
                        }
                    }}>Upvote</Button>
                    <Button fullWidth color={"red"} onClick={async () => {
                        try {
                            if(isVoter || isProposer){
                                
                                await vote(contract, commP, false)
                                showNotification({
                                    id: "bounty",
                                    title: "casting vote",
                                    message: "Please wait",
                                    loading: true,
                                    disallowClose: true,
                                    autoClose: false,
                                })
                            }else{
                                showNotification({
                                    id: "bounty",
                                    title: "you are not a DAO member",
                                    message: "you cannot vote",
                                    loading: true,
                                    disallowClose: true,
                                    autoClose: false,
                                })
                                return
                            }
                        } catch (e) {
                            console.log(e)
                            showNotification({
                                title: "Error",
                                message: "Something went wrong",
                            })
                        }
                    }}>Downvote</Button>
                </Button.Group>)
            setBadgeText("Ends " + end.fromNow())
            setBadgeColor("yellow")
        
        } else if (isEnded && !isValid) {
            setButtons(<Button color={"red"} fullWidth>Proposal Declined</Button>)
            setBadgeText("Proposal Declined")
            setBadgeColor("red")
        } else if (isEnded && isValid && !isBountyEnabled_ && numBounties === "0x00" && commpDeals.length > 0) {
            setButtons(<Button color={"pink.3"} fullWidth>Commp is already persisted on the network</Button>)
            setBadgeText("Proposal Already Persisted")
            setBadgeColor("black")
        }  else if (isEnded && activeState && isEnded && isValid && !isBountyEnabled_ && numBounties === "0x00") {
            setButtons(<Button color={"green.6"} onClick={() => setModalOpen(true)} fullWidth>Create Bounty</Button>)
            setBadgeText("Proposal Accepted")
            setBadgeColor("green.6")
        } else {
            setButtons(<Button color={"gray"} fullWidth>Bounty already created</Button>)
            setBadgeText("proposal accepted")
            setBadgeColor("gray")
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
                <Card.Section>
                    <Image src={"/proposal.webp"} height={180} />
                </Card.Section>
                <Card.Section p={"sm"}>
                    <Badge color={badgeColor}>{badgeText}</Badge>
                    <Text className={classes.title} lineClamp={4} weight={500}>
                        {commP}
                    </Text>
                    <Text size="xs" color="dimmed" lineClamp={4}>
                        {time.fromNow()}
                    </Text>
                    <Text size="sm" color="dimmed" lineClamp={4}>
                        {description}
                    </Text>
                </Card.Section>
                <Card.Section mt={"md"}>
                    {buttons}
                </Card.Section>
            </Card>
            {bountyModal}
        </>
    );
}