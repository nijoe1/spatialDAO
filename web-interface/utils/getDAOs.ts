import getDataDaos from "../hooks/useContract";



const getDAOs = async () => {
    const signer = await getDataDaos()
    return signer
}

export default getDAOs