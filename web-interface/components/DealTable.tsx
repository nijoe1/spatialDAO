import {Table} from "@mantine/core";
import {useEffect, useState} from "react";
import {stateMarketDeals} from "../constants";

export default function DealTable(props: { deals: number[] }) {
    const {deals} = props
    const [dealData, setDealData] = useState<any[]>([])

    const getDealData = () => {
        if(deals.length === 0) {
            setDealData([{dealId: "No", clientId: "Deals", providerId: "Found", fileSize: "Yet"}])
            return
        }
        let dealData: any[] = []
        deals.forEach((dealId) => {
            // @ts-ignore
            const data = stateMarketDeals[dealId]
            const remainDays = Math.floor(((new Date("2023-01-20").getSeconds() + (data.Proposal.EndEpoch * 30)) - new Date().getSeconds()) / (24 * 60 * 60))
            dealData.push({
                dealId: dealId,
                clientId: data.Proposal.Client,
                providerId: data.Proposal.Provider,
                fileSize: `${data.Proposal.PieceSize / 1024 / 1024 / 1024} GB`,
                duration: `${remainDays} days remain`
            })
        })
        setDealData(dealData)
    }

    useEffect(() => {
        getDealData()
    }, [props])

    const rows = dealData.map((deal) => {
        return (
            <tr>
                <td>{deal.dealId}</td>
                <td>{deal.clientId}</td>
                <td>{deal.providerId}</td>
                <td>{deal.fileSize}</td>
                <td>{deal.duration}</td>
            </tr>
        )
    })

    return (
        <Table>
            <thead>
            <tr>
                <th>Deal ID</th>
                <th>Client ID</th>
                <th>Provider ID</th>
                <th>File Size</th>
                <th>Duration</th>
            </tr>
            </thead>
            <tbody>
            {rows}
            </tbody>
        </Table>
    )
}