import {AppProps} from 'next/app';
import Head from 'next/head';
import {ColorScheme, ColorSchemeProvider, MantineProvider} from '@mantine/core';
import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultWallets,
    RainbowKitProvider,
    darkTheme
} from '@rainbow-me/rainbowkit';
import {
    chain,
    configureChains,
    createClient,
    WagmiConfig,
} from 'wagmi';
import {alchemyProvider} from 'wagmi/providers/alchemy';
import {publicProvider} from 'wagmi/providers/public';
import {useState, useEffect} from "react";
import {NotificationsProvider} from '@mantine/notifications'

import {GlobalContext} from "../contexts/GlobalContext";

/** Import Orbis SDK */
// @ts-ignore
import {Orbis} from "@orbisclub/orbis-sdk";
import {useHotkeys, useLocalStorage} from "@mantine/hooks";

let orbis = new Orbis();
const GROUP_ID = "kjzl6cwe1jw14axp80vka5y7ca38y09datmcu4bz0tz8xzntvn9la91292wfnhb";
const CHANNEL_ID = "kjzl6cwe1jw14b9kogz1as83u05pswa5fs4pzbejlr55f8njn108punvyyrymk5"

const hyperspace = {
    id: 3_141,
    name: 'Hyperspace',
    network: 'Hyperspace',
    nativeCurrency: {
        decimals: 18,
        name: 'Filecoin',
        symbol: 'tFIL',
    },
    rpcUrls: {
        default: "https://api.hyperspace.node.glif.io/rpc/v1",
    },
}

const {chains, provider, webSocketProvider} = configureChains(
    [hyperspace],
    [
        // @ts-ignore
        alchemyProvider({apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}), publicProvider()
    ]
);
const {connectors} = getDefaultWallets({
    appName: 'Spatial Dao',
    chains
});
const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
    webSocketProvider
})

export default function App(props: AppProps) {
    const [user, setUser] = useState(null);
    const group_id = GROUP_ID;
    const channel_id = CHANNEL_ID;
    const {Component, pageProps} = props;


    useEffect(() => {
        if (!user) {
            checkUserIsConnected();
        }
    }, [user]);

    /** We call this function on launch to see if the user has an existing Ceramic session. */
    async function checkUserIsConnected() {
        let res = await orbis.isConnected();

        /** If SDK returns user details we save it in state */
        if (res && res.status == 200) {
            setUser(res.details);
        }
    }

    const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
        key: 'mantine-color-scheme',
        defaultValue: 'dark',
        getInitialValueInEffect: true,
    });
    const toggleColorScheme = (value?: ColorScheme) =>
        setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
    useHotkeys([['mod+J', () => toggleColorScheme()]]);


    return (
        <>
            <Head>
                <title>SpatialDAO</title>
                <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width"/>
                <meta property="og:type" content="website"/>
            </Head>
            <GlobalContext.Provider value={{user, setUser, group_id, channel_id, orbis} as any}>
                <WagmiConfig client={wagmiClient}>
                    <RainbowKitProvider chains={chains} theme={darkTheme()}>
                        <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
                            <MantineProvider
                                withGlobalStyles
                                withNormalizeCSS
                                theme={{
                                    colorScheme,
                                    fontFamily: 'Helvetica, sans-serif',
                                    fontFamilyMonospace: 'Monaco, Courier, monospace',
                                    headings: { fontFamily: 'Helvetica, sans-serif' },
                                }}
                            >
                                <NotificationsProvider>
                                    <Component {...pageProps} wagmiClient={wagmiClient} />
                                </NotificationsProvider>
                            </MantineProvider>
                        </ColorSchemeProvider>
                    </RainbowKitProvider>
                </WagmiConfig>
            </GlobalContext.Provider>
        </>
    );
}