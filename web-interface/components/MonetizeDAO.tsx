import {useRouter} from "next/router";
import {useIsMounted} from "../hooks/useIsMounted";
import {useContract} from "../hooks/useContract";
import {showNotification, updateNotification} from "@mantine/notifications";
import {AddressInput} from "./AddressInput";
import {Container, Title} from "@mantine/core";
import {ethers} from "ethers";
import {DAO_abi} from "../constants";
import {useSigner} from "wagmi";
import {useEffect} from "react";


export default function MonetizeDAO() {
    const router = useRouter()
    const {data: signer} = useSigner()
    const mounted = useIsMounted()
    let contractAddress = ""
    if (typeof router.query.address === "string")
        contractAddress = router.query.address
    const {addVoter, addProposer, removeProposer, removeVoter} = useContract()


    const handleDeleteVoter = async (address: string) => {
        showNotification({
            id: "delete",
            title: "Deleting...",
            message: "Deleting member from DAO...",
            loading: true,
            autoClose: false,
            disallowClose: true,
        })
        try {
            const contract = new ethers.Contract(contractAddress, DAO_abi, signer!)
            await removeVoter(contract, address.toLowerCase())
            updateNotification({
                id: "delete",
                title: "Success!",
                message: "Member deleted from DAO!",
                color: "green",
                autoClose: true,
                disallowClose: true,
            })
        } catch (e) {
            console.log(e)
            updateNotification({
                id: "delete",
                title: "Error!",
                message: "Something went wrong! Check console for more info.",
                color: "red",
                autoClose: true,
                disallowClose: true,
            })
        }
    }

    const handleAddVoter = async (address: string) => {
        showNotification({
            id: "add",
            title: "Adding...",
            message: "Adding member to DAO...",
            loading: true,
            autoClose: false,
            disallowClose: true,
        })
        try {
            const contract = new ethers.Contract(contractAddress, DAO_abi, signer!)
            await addVoter(contract, address.toLowerCase())
            updateNotification({
                id: "add",
                title: "Success!",
                message: "Member added to DAO!",
                color: "green",
                autoClose: true,
                disallowClose: true,
            })
        } catch (e) {
            console.log(e)
            updateNotification({
                id: "add",
                title: "Error!",
                message: "Something went wrong! Check console for more info.",
                color: "red",
                autoClose: true,
                disallowClose: true,
            })
        }
    }

    const handleDeleteProposer = async (address: string) => {
        showNotification({
            id: "delete",
            title: "Deleting...",
            message: "Deleting member from DAO...",
            loading: true,
            autoClose: false,
            disallowClose: true,
        })
        try {
            const contract = new ethers.Contract(contractAddress, DAO_abi, signer!)
            await removeProposer(contract, address.toLowerCase())
            updateNotification({
                id: "delete",
                title: "Success!",
                message: "Member deleted from DAO!",
                color: "green",
                autoClose: true,
                disallowClose: true,
            })
        } catch (e) {
            console.log(e)
            updateNotification({
                id: "delete",
                title: "Error!",
                message: "Something went wrong! Check console for more info.",
                color: "red",
                autoClose: true,
                disallowClose: true,
            })
        }
    }

    const handleAddProposer = async (address: string) => {
        showNotification({
            id: "add",
            title: "Adding...",
            message: "Adding an Admin to DAO...",
            loading: true,
            autoClose: false,
            disallowClose: true,
        })
        try {
            const contract = new ethers.Contract(contractAddress, DAO_abi, signer!)
            await addProposer(contract, address.toLowerCase())
            updateNotification({
                id: "add",
                title: "Success!",
                message: "Member added to DAO!",
                color: "green",
                autoClose: true,
                disallowClose: true,
            })
        } catch (e) {
            console.log(e)
            updateNotification({
                id: "add",
                title: "Error!",
                message: "Something went wrong! Check console for more info.",
                color: "red",
                autoClose: true,
                disallowClose: true,
            })
        }
    }

    return (
        <>
            <h1>Monetize DAO</h1>
            <Container>
                <Title order={6}>Add Admin</Title>
                <AddressInput display={"Add"} onSubmit={handleAddProposer}/>
                
                <Title order={6}>Add Voter</Title>
                <AddressInput display={"Add"} onSubmit={handleAddVoter}/>
                <Title order={6}>Remove Voter</Title>
                <AddressInput display={"Remove"} onSubmit={handleDeleteVoter}/>
            </Container>
        </>
    )
}