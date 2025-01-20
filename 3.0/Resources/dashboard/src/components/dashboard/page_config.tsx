import { PageConfigMapping, PageLayout, PageLayoutType, Widget } from "@types";
import { addDays, endOfDay, startOfDay } from "date-fns";
import _ from 'lodash'



const overview: PageLayout = {
    type: PageLayoutType.Widgets,
    widgets: [
        {
            id: 'iviva-esg-now-application/widget/all-utilities-overview',
            name: 'All Utilities Overview',
            _id: 'all-u-o',
            hasConfigured: true,
            key: '2',
            layout: {
                _id: '1',
                x: 0,
                y: 0,
                w: 30,
                h: 8,
                i: '2',
                static: false
            }
        },
        {
            id: 'iviva-esg-now-application/widget/all-utilities-benchmark',
            name: 'All Utilities Benchmark',
            _id: 'all-u-o',
            key: '2',
            hasConfigured: true,
            layout: {
                _id: '1',
                x: 1,
                y: 1,
                w: 30,
                h: 11,
                i: '3',
                static: false
            }
        },
        {
            id: "iviva-esg-now-application/widget/consumption",
            name: 'Consumption',
            _id: '1',
            key: '1',
            hasConfigured: true,
            layout: {
                "_id": '1',
                x: 2,
                y: 2,
                w: 30,
                h: 15,
                i: '1',
                static: false
            },
            props: {
                title: 'Consumption',
                mainChartType: 'Composed',
                filters: {
                    startDate: (startOfDay(addDays(new Date(), -21))).toISOString(),
                    endDate: (endOfDay(addDays(new Date(), -1))).toISOString(),
                    utilityMeterType: 'energy',
                    unit: 'kwh',
                    targetType: 'utilitymeters',
                    targetIds: ['69376412-ac27-4109-9e86-baa0ce3b006f'],
                    tagGroup: null,
                    bucket: '1d',
                    group: null,
                    aggregation: 'sum',
                    chart: 'Bar'
                }

            },
            configurations: {
                layout: {
                    fixedHeight: true,
                    height: 100
                }
            }
        }
    ]
}

const energy: PageLayout = {
    type: PageLayoutType.Widgets,
    widgets: [
        {
            id: 'iviva-esg-now-application/widget/energy-intensity',
            name: 'Energy Use Intensity',
            hasConfigured: true,
            _id: 'eui',
            key: '1',
            layout: {
                _id: '1',
                x: 0,
                y: 0,
                w: 30,
                h: 8,
                i: '1',
                static: false
            }
        }
    ]
}

const meters: PageLayout = {
    type: PageLayoutType.Widgets,
    widgets: [
        {
            id: "iviva-esg-now-application/widget/meters",
            name: 'Meters',
            _id: '1',
            hasConfigured: true,
            key: '1',
            layout: {
                _id: '1',
                x: 0,
                y: 0,
                w: 30,
                h: 15,
                i: '1',
                static: false
            },
            props: {
                utilityType: ':utilitytype'
            },
            configurations: {
                layout: {
                    fixedHeight: true,
                    height: 100
                }
            }
        }
    ]
}

const deviations: PageLayout = {
    type: PageLayoutType.Widgets,
    widgets: [
        {
            id: "iviva-esg-now-application/widget/meters",
            name: 'Meters',
            _id: '1',
            key: '1',
            hasConfigured: true,
            layout: {
                _id: '1',
                x: 0,
                y: 0,
                w: 30,
                h: 15,
                i: '1',
                static: false
            },
            props: {
                utilityType: ':utilitytype',
                showOnlyDeviatedOnes: true
            },
            configurations: {
                layout: {
                    fixedHeight: true,
                    height: 100
                }
            }
        }
    ]
}


const tags: PageLayout = {
    type: PageLayoutType.Widgets,
    widgets: [
        {
            id: "iviva-esg-now-application/widget/tags",
            name: 'Tags',
            _id: '1',
            key: '1',
            hasConfigured: true,
            layout: {
                _id: '1',
                x: 0,
                y: 0,
                w: 30,
                h: 15,
                i: '1',
                static: false
            },
            props: {
                utilityType: ':utilitytype',
                // hideShadow: true
            },
            configurations: {
                layout: {
                    fixedHeight: true,
                    height: 100
                }
            }
        }
    ]

}

const configurationsPage: PageLayout = {
    type: PageLayoutType.Tabs,
    tabs: [
        {
            id: 'metertypes',
            label: 'Meter Types',
            content: {
                type: PageLayoutType.Widgets,
                widgets: [
                    {
                        id: "iviva-esg-now-application/widget/meter-type-configuration",
                        name: 'Meter Types Configuration Widget',
                        _id: '1',
                        key: '1',
                        hasConfigured: true,
                        layout: {
                            _id: '1',
                            x: 0,
                            y: 0,
                            w: 30,
                            h: 14,
                            i: '1',
                            static: false
                        },
                        props: {},
                        configurations: {
                            layout: {
                                fixedHeight: true,
                                height: 100
                            }
                        }
                    }
                ]
            }
        },
        {
            id: 'meters',
            label: 'Meters',
            content: {
                type: PageLayoutType.Widgets,
                widgets: [
                    {
                        id: "iviva-esg-now-application/widget/meter-configuration",
                        name: 'Meters Configuration Widget',
                        _id: '1',
                        key: '1',
                        hasConfigured: true,
                        layout: {
                            _id: '1',
                            x: 0,
                            y: 0,
                            w: 30,
                            h: 20,
                            i: '1',
                            static: false
                        },
                        props: {},
                        configurations: {
                            layout: {
                                fixedHeight: true,
                                height: 100
                            }
                        }
                    }
                ]
            }
        },
        {
            id: 'virtualmeters',
            label: 'Virtual Meters',
            content: {
                type: PageLayoutType.Widgets,
                widgets: [
                    {
                        id: "iviva-esg-now-application/widget/virtual-meter-configuration",
                        name: 'Virtual Meters Configuration Widget',
                        _id: '1',
                        key: '1',
                        hasConfigured: true,
                        layout: {
                            _id: '1',
                            x: 0,
                            y: 0,
                            w: 30,
                            h: 20,
                            i: '1',
                            static: false
                        },
                        props: {},
                        configurations: {
                            layout: {
                                fixedHeight: true,
                                height: 100
                            }
                        }
                    }
                ]
            }
        },
        {
            id: 'metergroups',
            label: 'Meter Groups',
            content: {
                type: PageLayoutType.Widgets,
                widgets: [
                    {
                        id: "iviva-esg-now-application/widget/meter-group-configuration",
                        name: 'Meter Group Configuration Widget',
                        _id: '1',
                        key: '1',
                        hasConfigured: true,
                        layout: {
                            _id: '1',
                            x: 0,
                            y: 0,
                            w: 30,
                            h: 20,
                            i: '1',
                            static: false
                        },
                        props: {},
                        configurations: {
                            layout: {
                                fixedHeight: true,
                                height: 100
                            }
                        }
                    }
                ]
            }
        },
        {
            id: 'tags',
            label: 'Tags',
            content: {
                type: PageLayoutType.Widgets,
                widgets: [
                    {
                        id: "iviva-esg-now-application/widget/tag-configuration",
                        name: 'Tag Configuration Widget',
                        _id: '1',
                        key: '1',
                        hasConfigured: true,
                        layout: {
                            _id: '1',
                            x: 0,
                            y: 0,
                            w: 30,
                            h: 20,
                            i: '1',
                            static: false
                        },
                        props: {},
                        configurations: {
                            layout: {
                                fixedHeight: true,
                                height: 100
                            }
                        }
                    }
                ]
            }
        },
        {
            id: 'baselinetypes',
            label: 'Baseline Types',
            content: {
                type: PageLayoutType.Widgets,
                widgets: [
                    {
                        id: "iviva-esg-now-application/widget/baseline-type-configuration",
                        name: 'Baseline Configuration Widget',
                        _id: '1',
                        key: '1',
                        hasConfigured: true,
                        layout: {
                            _id: '1',
                            x: 0,
                            y: 0,
                            w: 30,
                            h: 14,
                            i: '1',
                            static: false
                        },
                        props: {},
                        configurations: {
                            layout: {
                                fixedHeight: true,
                                height: 100
                            }
                        }
                    }
                ]
            }
        },
        {
            id: 'metadatatypes',
            label: 'Metadata Types',
            content: {
                type: PageLayoutType.Widgets,
                widgets: [
                    {
                        id: "iviva-esg-now-application/widget/metadata-type-configuration",
                        name: 'Metadata Type Configuration',
                        _id: '1',
                        key: '1',
                        hasConfigured: true,
                        layout: {
                            _id: '1',
                            x: 0,
                            y: 0,
                            w: 30,
                            h: 14,
                            i: '1',
                            static: false
                        },
                        props: {},
                        configurations: {
                            layout: {
                                fixedHeight: true,
                                height: 100
                            }
                        }
                    }
                ]
            }
        },
        {
            id: 'locationconfig',
            label: 'Location Configuration',
            content: {
                type: PageLayoutType.Widgets,
                widgets: [
                    {
                        id: "iviva-esg-now-application/widget/location-configuration",
                        name: 'Location Configuration Widget',
                        _id: '1',
                        key: '1',
                        hasConfigured: true,
                        layout: {
                            _id: '1',
                            x: 0,
                            y: 0,
                            w: 30,
                            h: 14,
                            i: '1',
                            static: false
                        },
                        props: {},
                        configurations: {
                            layout: {
                                fixedHeight: true,
                                height: 100
                            }
                        }
                    }
                ]
            }
        },
    ],
    selected: 'metertypes',
}



const advancedPage: PageLayout = {
    type: PageLayoutType.Tabs,
    tabs: [
        {
            id: 'queue',
            label: 'Queue',
            content: {
                type: PageLayoutType.Tabs,
                tabs: [
                    {
                        id: 'pending-queue',
                        label: 'Pending Queue',
                        content: {
                            type: PageLayoutType.Widgets,
                            widgets: [
                                {
                                    id: "iviva-esg-now-application/widget/pending-queue",
                                    name: 'Pending Queue',
                                    _id: '1',
                                    key: '1',
                                    hasConfigured: true,
                                    layout: {
                                        _id: '1',
                                        x: 0,
                                        y: 0,
                                        w: 30,
                                        h: 14,
                                        i: '1',
                                        static: false
                                    },
                                    props: {},
                                    configurations: {
                                        layout: {
                                            fixedHeight: true,
                                            height: 100
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        id: 'done-queue',
                        label: 'Done Queue',
                        content: {
                            type: PageLayoutType.Widgets,
                            widgets: [
                                {
                                    id: "iviva-esg-now-application/widget/done-queue",
                                    name: 'Done Queue',
                                    _id: '1',
                                    key: '1',
                                    hasConfigured: true,
                                    layout: {
                                        _id: '1',
                                        x: 0,
                                        y: 0,
                                        w: 30,
                                        h: 14,
                                        i: '1',
                                        static: false
                                    },
                                    props: {},
                                    configurations: {
                                        layout: {
                                            fixedHeight: true,
                                            height: 100
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        id: 'error-queue',
                        label: 'Error Queue',
                        content: {
                            type: PageLayoutType.Widgets,
                            widgets: [
                                {
                                    id: "iviva-esg-now-application/widget/error-queue",
                                    name: 'Error Queue',
                                    _id: '1',
                                    key: '1',
                                    hasConfigured: true,
                                    layout: {
                                        _id: '1',
                                        x: 0,
                                        y: 0,
                                        w: 30,
                                        h: 14,
                                        i: '1',
                                        static: false
                                    },
                                    props: {},
                                    configurations: {
                                        layout: {
                                            fixedHeight: true,
                                            height: 100
                                        }
                                    }
                                }
                            ]
                        }
                    },
                ],
                selected: 'pending-queue'
            }
        },
        {
            id: 'report',
            label: 'Reports',
            content: {
                type: PageLayoutType.Widgets,
                widgets: [
                    {
                        id: "iviva-esg-now-application/widget/report",
                        name: 'report',
                        _id: '1',
                        key: '1',
                        hasConfigured: true,
                        layout: {
                            _id: '1',
                            x: 0,
                            y: 0,
                            w: 30,
                            h: 14,
                            i: '1',
                            static: false
                        },
                        props: {},
                        configurations: {
                            layout: {
                                fixedHeight: true,
                                height: 100
                            }
                        }
                    }
                ]
            }
        }
    ],
    selected: 'queue',
}


export const pageConfig: PageConfigMapping = {
    "__home__": overview,
    "/overview": overview,
    "/energy": energy,
    "/utilitytype/:utilitytype/meters": meters,
    "/utilitytype/:utilitytype/deviations": deviations,
    "/utilitytype/:utilitytype/tags": tags,
    "/configurations": configurationsPage,
    "/advanced": advancedPage
}

// Function to match path with config and extract dynamic parameters
export function getPageConfigForRoute(path: string): { layout: PageLayout, params: Record<string, string> } {
    // Check for an exact match first
    if (pageConfig[path]) {
        return { layout: _.cloneDeep(pageConfig[path]), params: {} };
    }

    // Check for dynamic route matches
    for (const pattern in pageConfig) {
        // Convert pattern to a regular expression, capturing named parameters
        const paramNames: string[] = [];
        const regexPattern = pattern.replace(/:\w+/g, (match) => {
            paramNames.push(match.substring(1));  // Store the param name without ':'
            return "(\\w+)";
        });

        const regex = new RegExp(`^${regexPattern}$`);
        const match = path.match(regex);

        if (match) {
            // Extract param values from the matched path
            const params = paramNames.reduce((acc, paramName, index) => {
                acc[paramName] = match[index + 1];
                return acc;
            }, {} as Record<string, string>);

            return { layout: _.cloneDeep(pageConfig[pattern]), params };
        }
    }

    // Return null if no match found
    return { layout: null, params: {} };
}