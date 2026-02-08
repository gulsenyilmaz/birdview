export interface Movement
 {
  id: number;
  name: string;
  start_date: number | null;
  end_date: number | null;
  count: number;
  qid: string;
  inception: number | null;
  instance_label: string;
}