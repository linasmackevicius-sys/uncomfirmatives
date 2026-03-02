"use client";

interface DateRange {
  from: string;
  to: string;
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export default function DateRangePicker({ value, onChange }: Props) {
  return (
    <div className="date-range-picker">
      <input
        type="date"
        value={value.from}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
      />
      <span className="date-range-separator">to</span>
      <input
        type="date"
        value={value.to}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
      />
      <div className="date-range-presets">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange({ from: daysAgo(7), to: today() })}
        >
          7d
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange({ from: daysAgo(30), to: today() })}
        >
          30d
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange({ from: daysAgo(90), to: today() })}
        >
          90d
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange({ from: daysAgo(365), to: today() })}
        >
          1y
        </button>
      </div>
    </div>
  );
}
