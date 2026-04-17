import type { Human } from "./Human";

export interface RelatedHuman extends Human {
    relationship_type_name: string;
    start_date: number;
    end_date: number;
    index:number;
}