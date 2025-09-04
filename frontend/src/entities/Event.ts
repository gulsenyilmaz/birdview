export interface Event {
  id: number;
  name: string;
  battle: string;
  lat: number;
  lon: number;
  start_date: number;
  end_date: number;
  scale: number;
  description_json: any;
  participants: string[];
  winner: string;
  losers: string[];
  massacre: string;
  tooltip_text: string;
            
}
