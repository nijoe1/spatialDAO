import {useContract} from "../hooks/useContract";

interface NftCardProps {
    title: string;
    description?: string;
    spaceName?: string;
    image?: any;
    setModalOpen?: any;
    streamId: string
    timestamp: number
    daoAddress?: string,
    query?: string
}

import {
    Card,
    Text,
    createStyles,
    Button,
    Modal,
    Center,
    Badge,
    Input,
    NumberInput,
    NativeSelect,
    Image,
    BackgroundImage,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import {useRouter} from "next/router";
import {useContext, useEffect, useState} from "react";
import * as dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import {ethers} from "ethers";
import {DAO_abi, stateMarketDeals} from "../constants";
import {useSigner} from "wagmi";
import {showNotification, updateNotification} from "@mantine/notifications";
import Bounty from "./Bounty";
import {GlobalContext} from "../contexts/GlobalContext";
import {IconPlus} from "@tabler/icons";
import DealTable from "./DealTable";

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

export default function BountyCard({
                                       title: commP,
                                       streamId, query,
                                       description, timestamp, daoAddress
                                   }: NftCardProps & Omit<React.ComponentPropsWithoutRef<'div'>, keyof NftCardProps>) {
    const {classes, cx, theme} = useStyles();
    const {data: signer} = useSigner()
    const router = useRouter()
    // @ts-ignore
    const {orbis} = useContext(GlobalContext)

    let address = ""
    if (router.query.address)
        address = router.query.address as string
    else
        address = daoAddress as string
    const contract = new ethers.Contract(address, DAO_abi, signer!)
    const {
        getCommpBounty,
        isBountyCreated,
        getCommpDeals,
        isBountyEnabled,
        getCommpProposal,
        claim_bounty,
        fundBounty
    } = useContract()

    const [buttons, setButtons] = useState(<Button color={"yellow"} fullWidth>Fetching information</Button>)
    const [badgeText, setBadgeText] = useState("Fetching data")
    const [badgeColor, setBadgeColor] = useState("yellow")
    const [deals, setDeals] = useState<number[]>()
    const [modalOpen, setModalOpen] = useState(false)
    const [name, setName] = useState<string | undefined>()
    const [link, setLink] = useState<string | undefined>()

    let amt: number | undefined

    const time = dayjs.unix(timestamp)
    useEffect(() => {
        if (signer) {
            getState()
        }
        if (query) {
            const parsedQuery = JSON.parse(query)
            setName(parsedQuery.id)
            setLink(`/space/?id=${parsedQuery.id}&address=${parsedQuery.address}&groupId=${parsedQuery.groupId}`)
        }
    }, [commP, router.query.address, signer, query])

    const getState = async () => {
        const commP_ = await getCommpProposal(contract, commP)
        const res = await getCommpBounty(contract, commP)
        const isBounty = await isBountyCreated(contract, parseInt(commP_[0]))
        const isBountyEnabled_ = await isBountyEnabled(contract, commP)
        const remainingTokensHex = parseInt(res.requiredTokens._hex, 16)
        const tokensDonated = parseInt(res.donatedTokens._hex, 16)
        const numberOfBounties = parseInt(res.numberOfBounties._hex, 16)

        const commPDeals = await getCommpDeals(contract, commP)
        setDeals(commPDeals)

        const remainingTokens = ethers.utils.formatEther((remainingTokensHex - tokensDonated).toString())
        if (!isBountyEnabled_ && isBounty) {
            setButtons(
                <>
                    <NumberInput
                        placeholder={"Amount to fund"}
                        precision={2}
                        value={amt}
                        onChange={(e) => {
                            amt = e!
                        }}
                    />
                    <Button fullWidth color={"green.6"} onClick={async () => {
                        showNotification({
                            id: "bounty",
                            title: "Creating bounty",
                            message: "Please wait",
                            loading: true,
                            disallowClose: true,
                            autoClose: false,
                        })
                        orbis.isConnected().then((res: any) => {
                            if (res === false) {
                                alert("Please connect to orbis first")
                                updateNotification({
                                    title: "Bounty Funding Failed",
                                    message: "Please connect to orbis first",
                                    loading: false,
                                    disallowClose: false,
                                    autoClose: true,
                                    color: "red",
                                    id: "bounty"
                                })
                                return
                            }
                        })
                        try {
                            if (!amt)
                                throw "No amount specified"
                            if (amt > parseInt(remainingTokens))
                                throw "Amount exceeds remaining tokens"
                            console.log(commP, amt)
                            await fundBounty(contract, commP, amt!.toString())
                            await orbis.createPost({
                                context: streamId,
                                body: "Funded bounty for " + commP
                            })
                            updateNotification({
                                id: "bounty",
                                title: "Success",
                                message: "You voted for this proposal",
                                loading: false,
                                disallowClose: false,
                                autoClose: true,
                            })
                        } catch (e: any) {
                            console.log(e)
                            updateNotification({
                                id: "bounty",
                                title: "Error",
                                message: e,
                                loading: false,
                                disallowClose: false,
                                autoClose: true,
                                color: "red"
                            })
                        }
                    }}>Fund Bounty</Button>
                </>)
            setBadgeText("Remaining tokens: " + remainingTokens)
            setBadgeColor("orange")
        } else if (isBountyEnabled_) {
            // get the key for the stateMarket deals for which the cid is the commP
            const keys = [{value: "", label: "Select the deal ID"}];
            console.log(commP)
            for (const key in stateMarketDeals) {
                // @ts-ignore
                if (stateMarketDeals[key]["Proposal"]["PieceCID"]["/"] === commP) {
                    keys.push({
                        value: key,
                        // @ts-ignore
                        label: "Deal ID: " + key + " - Client ID: " + stateMarketDeals[key]["Proposal"]["Client"]
                    })
                }
            }
            let dealId: string


            setButtons(
                <>
                    <NativeSelect data={keys} onChange={(e) => {
                        dealId = e.currentTarget.value
                    }} required/>
                    <Button color={"grape"} fullWidth onClick={async () => {
                        showNotification({
                            id: "bounty",
                            title: "Claiming bounty",
                            message: "Please wait",
                            loading: true,
                            disallowClose: true,
                            autoClose: false,
                        })
                        orbis.isConnected().then((res: any) => {
                            if (res === false) {
                                alert("Please connect to orbis first")
                                updateNotification({
                                    title: "Bounty Funding Failed",
                                    message: "Please connect to orbis first",
                                    loading: false,
                                    disallowClose: false,
                                    autoClose: true,
                                    color: "red",
                                    id: "bounty"
                                })
                                return
                            }
                        })
                        try {
                            console.log(commP, dealId)
                            await claim_bounty(contract, parseInt(dealId))
                            await orbis.createPost({
                                context: streamId,
                                body: "Claimed bounty for " + commP
                            })
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
                    }}>Claim Bounty</Button>
                </>
            )
            setBadgeText("Number of bounties: " + numberOfBounties)
            setBadgeColor("violet")
        } else if (!isBountyEnabled_ && !isBounty) {
            setButtons(<Button color={"lime"} fullWidth>Bounty Fully Claimed</Button>)
            setBadgeText("Bounty Fully Claimed")
            setBadgeColor("lime")
        }
    }

    const dealsModal = (
        <Modal
            opened={modalOpen}
            size={"auto"}
            transition="fade"
            transitionDuration={500}
            transitionTimingFunction="ease"
            onClose={() => setModalOpen(false)}
        >
            <Center>
                <DealTable deals={deals!}/>
            </Center>
        </Modal>
    )

    return (
        <>
            <Card withBorder radius="md" className={cx(classes.card)} m={"md"} p={0}>
                <Card.Section>
                    <BackgroundImage src={"/bounty.webp"}>
                        <div style={{height: 180, position: "relative"}}>
                            <Tooltip label={"View all bounty deals"} position={"top"}>
                                <ActionIcon variant={"filled"} color={"pink"} onClick={() => setModalOpen(true)}
                                            sx={{position: "absolute", top: 0, right: 0, bottom: 0}}>
                                    <IconPlus/>
                                </ActionIcon>
                            </Tooltip>
                        </div>
                    </BackgroundImage>
                </Card.Section>
                <Card.Section pb={0} p={"sm"}>
                    <Badge color={badgeColor}>{badgeText}</Badge>
                    <Tooltip label={"This is the commP"}>
                        <Text className={classes.title} lineClamp={4} weight={500}>
                            {commP}
                        </Text>
                    </Tooltip>
                    <Text size="xs" color="dimmed" lineClamp={4}>
                        {time.fromNow()}
                    </Text>
                    <Tooltip label={"This is the description"}>
                        <Text size="md" lineClamp={4}>
                            {description}
                        </Text>
                    </Tooltip>
                    {name &&
                        <Tooltip label={"DAO Name"}>
                            <Text size={"sm"} color={"dimmed"} component={"a"} href={link}>
                                {name}
                            </Text>
                        </Tooltip>}
                </Card.Section>
                <Card.Section mt={"md"}>
                    {buttons}
                </Card.Section>
            </Card>
            {dealsModal}
        </>
    );
}