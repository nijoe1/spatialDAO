import {Center, Container, createStyles, Grid, List, SimpleGrid, Stack, Text, ThemeIcon, Title} from '@mantine/core';
import Head from 'next/head'
import {Layout} from "../components/Layout";
import {Hero} from "../components/Hero";
import {Features} from "../components/Features";
import {IconCheck} from "@tabler/icons";
import {useContext, useEffect, useState} from "react";
import ComingSoon1 from "../components/ComingSoon1";
import ComingSoon from "../components/ComingSoon";
import { GlobalContext } from '../contexts/GlobalContext';
import {useAccount} from "wagmi";


export default function Home() {
    const [nfts, setNfts] = useState();
    const {isDisconnected} = useAccount()
    // @ts-ignore
    const {orbis, user, setUser} = useContext(GlobalContext)

    const logout = async () => {
        if (isDisconnected) {
            let res = await orbis.isConnected()
            if (res.status == 200) {
                await orbis.logout()
                setUser(null)
                console.log("User is connected: ", res);
            }
        }
    }

    useEffect(() => {
        logout()
    }, [isDisconnected])


    return (
        <>
            <Head>
                <title>spatial.DAO</title>
                <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width"/>
            </Head>
            <Layout>
                <Container m={"xl"} size={1800}>
                    <Hero/>
                </Container>
                <Container m={"xl"} mt={100} size={1800}>
                    <Features/>
                </Container>
                <Center p={"xl"} m={"xl"}>
                    <Stack mt={75}>
                        <Center>
                            <Title order={1}>How to use this platform?</Title>
                        </Center>
                        <List
                            my={"md"}
                            spacing="xl"
                            size="xl"
                            icon={
                                <ThemeIcon size={20} radius="xl">
                                    <IconCheck size={12} stroke={1.5}/>
                                </ThemeIcon>
                            }
                        >
                            <List.Item>
                                <b>Create your dataDAO</b> – choose the DAO proposers and Voters create you
Decentralized social layer with one click
                            </List.Item>
                            <List.Item>
                                <b>Propose Files</b> – choose a file that your DAO wants it permanent
                            </List.Item>
                            <List.Item>
                                <b>Create Bounties</b> – Create bunties on succesfully proposed files
                            </List.Item>
                            <List.Item>
                                <b>Reward deal makers</b> – Reward deal clients that claim your dataDAO bounties
                            </List.Item>
                        </List>
                    </Stack>
                </Center>
                <Center mt={"xl"}>
                    <Title>What's to come?</Title>
                </Center>
                <Center>
                    <Container m={"xl"} mt={100} size={1000}>
                        <Grid>
                            <Grid.Col lg={6}>
                                <ComingSoon title={"Documentation"}
                                            description={"We also want to make it so that digital artists can come and build cool things by providing a guide of how to use our native Dynamic features written natively inside the CryptoStudio smart contract."}/>
                            </Grid.Col>
                            <Grid.Col lg={6}>
                                <ComingSoon1 title={"Playground"}
                                             description={"The future of CryptoStudio is to make it more accessible to the public. We want to make it so that anyone can create their own Dynamic NFTs with zero coding experience by creating a free and open to use web-based tool for designing and developing dynamic 2D & 3D NFT models. "}/>
                            </Grid.Col>
                        </Grid>
                    </Container>
                </Center>
                
            </Layout>
        </>
    )
}
