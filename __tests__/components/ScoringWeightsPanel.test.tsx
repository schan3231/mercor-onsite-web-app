import { render, screen, fireEvent } from "@testing-library/react";
import ScoringWeightsPanel from "@/components/ScoringWeightsPanel";
import { ROLE_PRESETS } from "@/lib/presets";
import { ScoringWeights } from "@/lib/types";

const defaultWeights: ScoringWeights = {
  education: 25,
  experience: 25,
  skills: 25,
  salaryEfficiency: 25,
};

const defaultProps = {
  weights: defaultWeights,
  activePresetId: "balanced",
  presets: ROLE_PRESETS,
  onWeightsChange: jest.fn(),
  onPresetSelect: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe("ScoringWeightsPanel — preset buttons", () => {
  it("renders all 6 preset buttons", () => {
    render(<ScoringWeightsPanel {...defaultProps} />);
    for (const preset of ROLE_PRESETS) {
      expect(screen.getByText(preset.label)).toBeInTheDocument();
    }
  });

  it("active preset button has indigo background", () => {
    render(<ScoringWeightsPanel {...defaultProps} activePresetId="balanced" />);
    const balancedBtn = screen.getByText("Balanced").closest("button")!;
    expect(balancedBtn).toHaveClass("bg-indigo-600");
  });

  it("inactive preset buttons have gray background", () => {
    render(<ScoringWeightsPanel {...defaultProps} activePresetId="balanced" />);
    const ceoBtn = screen.getByText("CEO").closest("button")!;
    expect(ceoBtn).toHaveClass("bg-gray-100");
    expect(ceoBtn).not.toHaveClass("bg-indigo-600");
  });

  it("clicking a preset calls onPresetSelect with the correct preset", () => {
    const onPresetSelect = jest.fn();
    render(<ScoringWeightsPanel {...defaultProps} onPresetSelect={onPresetSelect} />);
    fireEvent.click(screen.getByText("CEO").closest("button")!);
    expect(onPresetSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ceo" })
    );
  });

  it("clicking active preset still calls onPresetSelect", () => {
    const onPresetSelect = jest.fn();
    render(<ScoringWeightsPanel {...defaultProps} onPresetSelect={onPresetSelect} activePresetId="ceo" />);
    fireEvent.click(screen.getByText("CEO").closest("button")!);
    expect(onPresetSelect).toHaveBeenCalledTimes(1);
  });
});

describe("ScoringWeightsPanel — weight sliders", () => {
  it("renders all 4 weight labels", () => {
    render(<ScoringWeightsPanel {...defaultProps} />);
    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
  });

  it("displays current weight values", () => {
    render(<ScoringWeightsPanel {...defaultProps} />);
    // All 4 weights are 25, so we should see "25%" four times
    const percentages = screen.getAllByText("25%");
    expect(percentages).toHaveLength(4);
  });

  it("shows 100% total indicator when weights sum to 100", () => {
    render(<ScoringWeightsPanel {...defaultProps} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("total indicator has green class when sum is 100", () => {
    render(<ScoringWeightsPanel {...defaultProps} />);
    const totalEl = screen.getByText("100%");
    expect(totalEl).toHaveClass("text-emerald-600");
  });

  it("slider values match the weights prop", () => {
    const asymmetricWeights: ScoringWeights = {
      education: 40,
      experience: 30,
      skills: 20,
      salaryEfficiency: 10,
    };
    render(<ScoringWeightsPanel {...defaultProps} weights={asymmetricWeights} />);
    const sliders = screen.getAllByRole("slider");
    const values = sliders.map((s) => parseInt(s.getAttribute("value") ?? "0", 10));
    expect(values).toContain(40);
    expect(values).toContain(30);
    expect(values).toContain(20);
    expect(values).toContain(10);
  });

  it("changing a slider calls onWeightsChange with updated weights", () => {
    const onWeightsChange = jest.fn();
    render(<ScoringWeightsPanel {...defaultProps} onWeightsChange={onWeightsChange} />);
    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "40" } });
    expect(onWeightsChange).toHaveBeenCalled();
  });

  it("weights returned by onWeightsChange sum to 100", () => {
    const onWeightsChange = jest.fn();
    render(<ScoringWeightsPanel {...defaultProps} onWeightsChange={onWeightsChange} />);
    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "50" } });
    const newWeights = onWeightsChange.mock.calls[0][0] as ScoringWeights;
    const total =
      newWeights.education +
      newWeights.experience +
      newWeights.skills +
      newWeights.salaryEfficiency;
    expect(total).toBe(100);
  });
});
