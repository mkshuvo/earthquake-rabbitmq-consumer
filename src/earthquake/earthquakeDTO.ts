export class EarthquakeDTO {
    type: string;
    metadata: {
        generated: number;
        url: string;
        title: string;
        status: number;
        api: string;
        count: number;
    };
    features: {
        type: string;
        properties: {
            mag: number;
            place: string;
            time: number;
            updated: number;
            tz: null | string;
            url: string;
            detail: string;
            felt: null | number;
            cdi: null | number;
            mmi: null | number;
            alert: null | string;
            status: string;
            tsunami: number;
            sig: number;
            net: string;
            code: string;
            ids: string;
            sources: string;
            types: string;
            nst: number;
            dmin: number;
            rms: number;
            gap: number;
            magType: string;
            type: string;
            title: string;
        };
        geometry: {
            type: string;
            coordinates: [number, number, number];
        };
        id: string;
    }[];
}
