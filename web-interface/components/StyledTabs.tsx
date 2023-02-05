import { Tabs, TabsProps } from '@mantine/core';

export default function StyledTabs(props: TabsProps) {
    return (
        <Tabs
            unstyled
            styles={(theme) => ({
                tab: {
                    ...theme.fn.focusStyles(),
                    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.violet[5] : "#DA77F2",
                    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.white,
                    border: `2px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[6] : "#DA77F2"}`,
                    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
                    cursor: 'pointer',
                    fontSize: theme.fontSizes.sm,
                    display: 'flex',
                    alignItems: 'center',

                    '&:disabled': {
                        opacity: 0.5,
                        cursor: 'not-allowed',
                    },

                    '&:not(:first-of-type)': {
                        borderLeft: 0,
                    },

                    '&:first-of-type': {
                        borderTopLeftRadius: theme.radius.md,
                        borderBottomLeftRadius: theme.radius.md,
                    },

                    '&:last-of-type': {
                        borderTopRightRadius: theme.radius.md,
                        borderBottomRightRadius: theme.radius.md,
                    },

                    '&[data-active]': {
                        backgroundColor: theme.colors.black,
                        borderColor: theme.colors.violet[4],
                        color: theme.white,
                        fontWeight: 700,
                    },
                },

                tabIcon: {
                    marginRight: theme.spacing.xs,
                    display: 'flex',
                    alignItems: 'center',
                },

                tabsList: {
                    display: 'flex',
                    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
                        overflowX: 'auto',
                    },
                },
            })}
            {...props}
        />
    );
}