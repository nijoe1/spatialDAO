import {
  Center,
  Container,
  Grid,
  List,
  Stack,
  ThemeIcon,
  Title,
} from "@mantine/core";
import Head from "next/head";
import { Layout } from "../components/Layout";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { IconCheck } from "@tabler/icons";
import { useContext, useEffect } from "react";
import ComingSoon1 from "../components/ComingSoon1";
import ComingSoon from "../components/ComingSoon";
import { GlobalContext } from "../contexts/GlobalContext";
import { useAccount } from "wagmi";

export default function Home() {
  const { isDisconnected } = useAccount();
  // @ts-ignore
  const { orbis, user, setUser } = useContext(GlobalContext);

  const logout = async () => {
    if (isDisconnected) {
      let res = await orbis.isConnected();
      if (res.status == 200) {
        await orbis.logout();
        setUser(null);
        console.log("User is connected: ", res);
      }
    }
  };

  useEffect(() => {
    logout();
  }, [isDisconnected]);

  return (
    <>
      <Head>
        <title>spatial.DAO</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <Center>
        <Layout>
            
          <Container m={"xl"} size={1800}>
            
            <Hero />
          </Container>
          <Container m={"xl"} mt={100} size={1800} bottom={600}>
            <Features />
          </Container>
          <Center p={"xl"} m={"xl"}>
            <Stack mt={75} top={-600}>
              <Center>
                <Title order={1}>How to use this platform?</Title>
              </Center>
              <List
                my={"md"}
                spacing="xl"
                size="xl"
                top={-600}
                icon={
                  <ThemeIcon color={"violet"} size={20} radius="xl">
                    <IconCheck size={12} stroke={1.5} />
                  </ThemeIcon>
                }
              >
                <List.Item>
                  <b>Create your dataDAO</b>: Choose the DAO admins and
                  voters then create you Decentralized social layer. 
                  All that with one click
                </List.Item>
                <List.Item>
                  <b>Propose Files</b>: Choose a file that your DAO wants it
                  permanent
                </List.Item>
                <List.Item>
                  <b>Create Bounties</b>: Create bunties on succesfully
                  proposed files
                </List.Item>
                <List.Item>
                  <b>Reward deal makers</b>: Reward deal clients that claim
                  your dataDAO bounties
                </List.Item>
                <List.Item>
                  <b>Connect with DAO members</b>: We offer a decetralized social layer powered by orbis.club for each dataDAO
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
                  <ComingSoon
                    title={"Integrate OpenZeppelin Proxy pattern Factory"}
                    description={
                      "We have plans to create a proxy pattern factory to save gas for our Users."
                    }
                  />
                </Grid.Col>
                <Grid.Col lg={6}>
                  <ComingSoon1
                    title={"Integrate OpenZeppelin governor"}
                    description={
                      "We have plans to use the Audited Governor from OpenZeppelin and combine it with Tableland once they implement their features on Filecoin that way we are going to minimize the Actor( Smart Contract ) state and save fees for our users. "
                    }
                  />
                </Grid.Col>
              </Grid>
            </Container>
          </Center>
        </Layout>
      </Center>
    </>
  );
}
