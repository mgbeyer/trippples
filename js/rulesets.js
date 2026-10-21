
const RULESETS = {
    current: {
        id: "current",
        name: "Current Rules",

        board: {
            size: 8,
            arrowCombinationCount: 56,
            anyFieldCount: 2,
            blockedFields: []
        },

        players: {
            orange: {
                start: { x: 4, y: 7 },
                route: [
                    { x: 6, y: 6 },
                    { x: 6, y: 1 },
                    { x: 1, y: 1 },
                    { x: 1, y: 6 },
                    { x: 3, y: 7 }
                ]
            },

            blue: {
                start: { x: 3, y: 7 },
                route: [
                    { x: 1, y: 6 },
                    { x: 1, y: 1 },
                    { x: 6, y: 1 },
                    { x: 6, y: 6 },
                    { x: 4, y: 7 }
                ]
            }
        }
    },

    classic: {
        id: "classic",
        name: "Classic Rules",

        board: {
            size: 8,
            arrowCombinationCount: 56,
            anyFieldCount: 0,
            blockedFields: [
                { x: 3, y: 3 },
                { x: 4, y: 3 },
                { x: 3, y: 4 },
                { x: 4, y: 4 }
            ]
        },

        players: {
            orange: {
                start: { x: 0, y: 7 },
                route: [
                    { x: 7, y: 0 }
                ]
            },

            blue: {
                start: { x: 7, y: 7 },
                route: [
                    { x: 0, y: 0 }
                ]
            }
        }
    }
};
