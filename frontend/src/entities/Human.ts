export interface Human {
  id: number;
  name: string;
  birth_date: number;
  death_date: number | null;
  gender: string;
  nationality: string;
  lat: number;
  lon: number;
  city: string;
  city_index: number;
  num_of_identifiers: number;
  qid:string;
  img_url:string;
}