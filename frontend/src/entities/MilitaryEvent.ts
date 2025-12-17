export interface MilitaryEvent {
    id: number;
    qid: string;
    name: string;
    image_url: string;
    description: string;
    start_time: number;
    end_time: any;
    point_in_time: any;
    start_date: number;
    end_date: number;
    wiki_url: string;
    lat: number;
    lon: number;
    depth_index: number;
    entity_type: string;
    depth_level: number;
    descendant_count: number;
    parent_id: number;
    event_type: string;
}
