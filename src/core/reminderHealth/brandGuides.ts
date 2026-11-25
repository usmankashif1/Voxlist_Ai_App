import type { ReminderDeviceInfo } from '../notifications/reminderStatus';

export interface BrandGuideVariant {
    skinIncludes: string | null;
    label: string;
    steps: string[];
    settingsSearchKeywords: string[];
}

export interface BrandGuide {
    id: string;
    name: string;
    brands: string[];
    variants: BrandGuideVariant[];
}

const brandGuides: BrandGuide[] = [
    {
        id: 'samsung',
        name: 'Samsung',
        brands: ['samsung'],
        variants: [
            {
                skinIncludes: 'one ui',
                label: 'Samsung - One UI',
                steps: [
                    'Open Settings, then Apps, and choose Voxlist AI.',
                    'Open Battery and choose Unrestricted.',
                    'If reminders are still delayed, check Background usage limits and add Voxlist AI to Never sleeping apps.',
                ],
                settingsSearchKeywords: [
                    'Voxlist AI battery',
                    'Background usage limits',
                    'Never sleeping apps',
                ],
            },
            {
                skinIncludes: null,
                label: 'Samsung',
                steps: [
                    'Open Settings, then Apps, and choose Voxlist AI.',
                    'Look under Battery for an option that allows background activity.',
                    'If reminders are still delayed, search Settings for background usage limits.',
                ],
                settingsSearchKeywords: ['Voxlist AI battery', 'background usage limits'],
            },
        ],
    },
    {
        id: 'xiaomi',
        name: 'Xiaomi, Redmi, or POCO',
        brands: ['xiaomi', 'redmi', 'poco'],
        variants: [
            {
                skinIncludes: 'hyperos',
                label: 'Xiaomi - HyperOS',
                steps: [
                    'Open Settings, then Apps, and choose Voxlist AI.',
                    'In Battery saver, allow background activity or choose No restrictions.',
                    'If available, allow Voxlist AI to start automatically.',
                ],
                settingsSearchKeywords: ['Voxlist AI battery', 'No restrictions', 'Autostart'],
            },
            {
                skinIncludes: null,
                label: 'Xiaomi - MIUI',
                steps: [
                    'Open Settings, then Apps, and choose Voxlist AI.',
                    'In Battery saver, choose No restrictions.',
                    'If available, allow Voxlist AI to start automatically.',
                ],
                settingsSearchKeywords: ['Voxlist AI battery', 'No restrictions', 'Autostart'],
            },
        ],
    },
    {
        id: 'oppo',
        name: 'OPPO, realme, or OnePlus',
        brands: ['oppo', 'realme', 'oneplus'],
        variants: [
            {
                skinIncludes: 'coloros',
                label: 'ColorOS',
                steps: [
                    'Open Settings, then Apps, and choose Voxlist AI.',
                    'Allow background activity and automatic launch if those options are available.',
                    'Search Settings for battery usage if the menu names differ.',
                ],
                settingsSearchKeywords: ['Voxlist AI battery', 'Auto launch', 'Background activity'],
            },
            {
                skinIncludes: 'oxygenos',
                label: 'OxygenOS',
                steps: [
                    'Open Settings, then Apps, and choose Voxlist AI.',
                    'Allow background activity and automatic launch if those options are available.',
                    'Search Settings for battery usage if the menu names differ.',
                ],
                settingsSearchKeywords: ['Voxlist AI battery', 'Auto launch', 'Background activity'],
            },
            {
                skinIncludes: null,
                label: 'OPPO family',
                steps: [
                    'Open Settings, then Apps, and choose Voxlist AI.',
                    'Allow background activity and automatic launch if those options are available.',
                    'Search Settings for battery usage if the menu names differ.',
                ],
                settingsSearchKeywords: ['Voxlist AI battery', 'Auto launch', 'Background activity'],
            },
        ],
    },
    {
        id: 'vivo',
        name: 'vivo or iQOO',
        brands: ['vivo', 'iqoo'],
        variants: [
            {
                skinIncludes: null,
                label: 'vivo family',
                steps: [
                    'Open Settings, then Apps, and choose Voxlist AI.',
                    'Allow background power use and automatic start if those options are available.',
                    'Search Settings for background power use if the menu names differ.',
                ],
                settingsSearchKeywords: ['Voxlist AI battery', 'Background power use', 'Autostart'],
            },
        ],
    },
    {
        id: 'huawei',
        name: 'Huawei or HONOR',
        brands: ['huawei', 'honor'],
        variants: [
            {
                skinIncludes: 'emui',
                label: 'EMUI',
                steps: [
                    'Open Settings, then Apps, and choose Voxlist AI.',
                    'Open App launch, manage it manually, and allow background activity.',
                    'Search Settings for App launch if the menu names differ.',
                ],
                settingsSearchKeywords: ['Voxlist AI App launch', 'Manage manually'],
            },
            {
                skinIncludes: null,
                label: 'Huawei family',
                steps: [
                    'Open Settings, then Apps, and choose Voxlist AI.',
                    'Allow background activity and automatic launch if those options are available.',
                    'Search Settings for App launch if the menu names differ.',
                ],
                settingsSearchKeywords: ['Voxlist AI App launch', 'Background activity'],
            },
        ],
    },
    {
        id: 'transsion',
        name: 'TECNO, Infinix, or itel',
        brands: ['tecno', 'infinix', 'itel'],
        variants: [
            {
                skinIncludes: null,
                label: 'Transsion',
                steps: [
                    'Open Settings or Phone Master and choose app management.',
                    'Allow Voxlist AI to start automatically and run in the background if those options are available.',
                    'Search Settings for Autostart or battery management if the menu names differ.',
                ],
                settingsSearchKeywords: ['Voxlist AI', 'Autostart', 'Battery management'],
            },
        ],
    },
];

export const getBrandGuide = (deviceInfo: ReminderDeviceInfo): BrandGuideVariant & {
    id: string;
    name: string;
} | null => {
    const deviceName = `${deviceInfo.manufacturer} ${deviceInfo.brand}`.toLowerCase();
    const guide = brandGuides.find(candidate => (
        candidate.brands.some(brand => deviceName.includes(brand))
    ));
    if (!guide) return null;

    const skinHint = deviceInfo.osSkinHint?.toLowerCase() ?? '';
    const variant = guide.variants.find(candidate => (
        candidate.skinIncludes !== null && skinHint.includes(candidate.skinIncludes)
    )) ?? guide.variants.find(candidate => candidate.skinIncludes === null);

    return variant
        ? {
            id: guide.id,
            name: guide.name,
            ...variant,
            label: deviceInfo.osSkinHint
                ? `${guide.name} - ${deviceInfo.osSkinHint}`
                : variant.label,
        }
        : null;
};
