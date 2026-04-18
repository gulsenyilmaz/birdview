interface YearLineProps {
  selectedYear: number;
  windowRange?: [number, number];
}

const YearLine: React.FC<YearLineProps> = ({
  selectedYear,
  windowRange = [1200, 2025],
}) => {
  const [minYear, maxYear] = windowRange;
  const totalRange = maxYear - minYear;

  const getLeftPercent = (year: number): number =>
    ((year - minYear) / totalRange) * 95;

  const left = getLeftPercent(selectedYear);

  return <div className="year-container" ><div className="year-line" style={{ left: `${left}%` }} /></div>;
};

export default YearLine;