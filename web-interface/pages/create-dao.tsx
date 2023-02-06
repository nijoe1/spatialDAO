import Head from 'next/head'
import {Layout} from "../components/Layout";
import {Button, Container, FileInput, Textarea, TextInput, Text, Title,} from "@mantine/core";
import {IconUpload} from "@tabler/icons";
import {useContext, useEffect, useState} from "react";
import useNftStorage from "../hooks/useNftStorage";
import {showNotification, updateNotification} from "@mantine/notifications";
import {useRouter} from "next/router"
import {useAccount} from "wagmi";
// @ts-ignore
import {Orbis} from "@orbisclub/orbis-sdk";
import {GlobalContext} from "../contexts/GlobalContext";
import {useContract} from "../hooks/useContract";
import {useIsMounted} from "../hooks/useIsMounted";
import {useListState} from "@mantine/hooks";
import {AddressInput} from "../components/AddressInput";
import { MemberList } from '../components/MemberList';

export default function CreateDao() {
    const [daoName, setDaoName] = useState<string>("")
    const {address, isDisconnected} = useAccount()
    const [proposers, proposersHandlers] = useListState<string>([]);
    const [voters, votersHandlers] = useListState<string>([]);
    const [loading, setLoading] = useState(false)
    const [daoDescription, setDaoDescription] = useState<String>("")
    const {uploadImage} = useNftStorage()
    const {createDataDao, getDataDaos} = useContract()
    const [disabled, setDisabled] = useState(true)
    const [spacePfp, setSpacePfp] = useState<File>()
    // @ts-ignore
    const {orbis, setUser} = useContext(GlobalContext)

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

    const handleCreateDAO = async () => {
        setLoading(true)
        if (daoName && spacePfp) {
            addProposer(address as string)
            showNotification({
                id: "space",
                title: "Creating your dataDAO",
                message: "Please wait while we create your space",
                loading: true,
                disallowClose: true,
                autoClose: false
            })
            const cid = await uploadImage(spacePfp!)
            const res = await orbis.createGroup({
                pfp: `https://ipfs.io/ipfs/${cid}`,
                name: daoName,
                description: daoDescription
            })
            const groupId = res.doc
            try {
                await createDataDao(proposers, voters, daoName, groupId)
                updateNotification({
                    id: "space",
                    title: "Success",
                    message: "dataDAO has been created",
                    color: "green",
                    autoClose: 5000
                })
                setLoading(false)
                // router.reload()
            } catch (e) {
                console.log(e)
                updateNotification({
                    id: "space",
                    title: "Error",
                    // @ts-ignore
                    message: e.message,
                    color: "red",
                    autoClose: 5000
                })
                setLoading(false)
            }
        } else {
            alert("Please fill all fields")
            setLoading(false)
        }
    }

    const removeProposer = (member: string) => {
        proposersHandlers.filter(
            (other: string) => other.toLowerCase() !== member.toLowerCase()
        );
    };

    const addProposer = (member: string) => {
        removeProposer(member);
        proposersHandlers.append(member);
    };

    const removeVoter = (member: string) => {
        votersHandlers.filter(
            (other: string) => other.toLowerCase() !== member.toLowerCase()
        );
    };

    const addVoter = (member: string) => {
        removeVoter(member);
        votersHandlers.append(member);
    };

    return (
        <>
            <Head>
                <title>Create DAO - SpatialDAO</title>
                <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width"/>
            </Head>
            <Layout>
                <Container>
                    <Title order={1}>Create DAO</Title>
                    <TextInput m={"md"} label={"DAO Name"} value={daoName as string}
                               onChange={(event) => setDaoName(event.currentTarget.value)}
                               placeholder="Name" required/>
                    <Textarea m={"md"} label={"DAO Description"} value={daoDescription as string} onChange={(event) => setDaoDescription(event.currentTarget.value)}
                              placeholder="Description" required/>
                    <FileInput m={"md"} required label={"Upload your space image"} placeholder={"Upload image file"}
                               accept={"image/*"} icon={<IconUpload size={14}/>} value={spacePfp as any}
                               onChange={setSpacePfp as any}/>
                    <Text m={"md"} size={"md"}>Add Admins.</Text>
                    <AddressInput display={"Add"} onSubmit={addProposer} />
                    <MemberList
                        label="Admins"
                        members={proposers}
                        editable={true}
                        onRemove={removeProposer}
                    />
                    <Text m={"md"} size={"md"}>Add Voter</Text>
                    <AddressInput display={"Add"} onSubmit={addVoter} />
                    <MemberList
                        label="Voters"
                        members={voters}
                        editable={true}
                        onRemove={removeVoter}
                    />
                    <Button variant={"gradient"} gradient={{from: "pink", to: "blue", deg: 110}} disabled={loading} m={"md"} onClick={async () => await handleCreateDAO()}>Create DAO </Button>
                </Container>

            </Layout>
        </>
    )
}
