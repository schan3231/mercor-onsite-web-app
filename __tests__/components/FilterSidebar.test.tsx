import { render, screen, fireEvent } from "@testing-library/react";
import FilterSidebar from "@/components/FilterSidebar";
import { FilterState } from "@/lib/types";

const salaryRange = { min: 45000, max: 145000 };

const defaultFilters: FilterState = {
  search: "",
  skills: [],
  location: "",
  education: "",
  salaryMin: 45000,
  salaryMax: 145000,
};

const allSkills = ["Docker", "Figma", "JavaScript", "Python", "React", "TypeScript"];
const allLocations = ["Argentina", "Brazil", "Canada", "Germany", "United States"];
const educationLevels = [
  "High School Diploma",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
];

const defaultProps = {
  filters: defaultFilters,
  allSkills,
  allLocations,
  educationLevels,
  salaryRange,
  onChange: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe("FilterSidebar — location", () => {
  it("renders 'All locations' as the default option", () => {
    render(<FilterSidebar {...defaultProps} />);
    expect(screen.getByDisplayValue("All locations")).toBeInTheDocument();
  });

  it("selecting a location calls onChange with updated location", () => {
    const onChange = jest.fn();
    render(<FilterSidebar {...defaultProps} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue("All locations"), {
      target: { value: "Canada" },
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ location: "Canada" }));
  });

  it("renders all location options", () => {
    render(<FilterSidebar {...defaultProps} />);
    for (const loc of allLocations) {
      expect(screen.getByRole("option", { name: loc })).toBeInTheDocument();
    }
  });
});

describe("FilterSidebar — education", () => {
  it("renders 'Any level' as the default option", () => {
    render(<FilterSidebar {...defaultProps} />);
    expect(screen.getByDisplayValue("Any level")).toBeInTheDocument();
  });

  it("selecting an education level calls onChange with that level", () => {
    const onChange = jest.fn();
    render(<FilterSidebar {...defaultProps} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue("Any level"), {
      target: { value: "Master's Degree" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ education: "Master's Degree" })
    );
  });
});

describe("FilterSidebar — skills", () => {
  it("selected skills appear as removable chips", () => {
    render(
      <FilterSidebar
        {...defaultProps}
        filters={{ ...defaultFilters, skills: ["React", "Python"] }}
      />
    );
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
  });

  it("clicking a selected skill chip removes it", () => {
    const onChange = jest.fn();
    render(
      <FilterSidebar
        {...defaultProps}
        filters={{ ...defaultFilters, skills: ["React", "Python"] }}
        onChange={onChange}
      />
    );
    // Click the React chip to remove it
    fireEvent.click(screen.getByText("React").closest("button")!);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: expect.not.arrayContaining(["React"]),
      })
    );
  });

  it("clicking an unselected skill adds it", () => {
    const onChange = jest.fn();
    render(<FilterSidebar {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText("Docker"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ skills: expect.arrayContaining(["Docker"]) })
    );
  });

  it("selected skills are not shown in the list (deduplication)", () => {
    render(
      <FilterSidebar
        {...defaultProps}
        filters={{ ...defaultFilters, skills: ["React"] }}
      />
    );
    // "React" should appear once (as chip) — the list should not duplicate it
    const reactElements = screen.getAllByText("React");
    // One in the chip, not also in the scrollable list
    expect(reactElements.length).toBe(1);
  });
});

describe("FilterSidebar — clear all button", () => {
  it("clear all button is hidden when no filters are active", () => {
    render(<FilterSidebar {...defaultProps} />);
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  it("clear all button appears when a skill filter is set", () => {
    render(
      <FilterSidebar
        {...defaultProps}
        filters={{ ...defaultFilters, skills: ["Python"] }}
      />
    );
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("clear all button appears when location is set", () => {
    render(
      <FilterSidebar
        {...defaultProps}
        filters={{ ...defaultFilters, location: "Canada" }}
      />
    );
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("clicking clear all calls onChange with empty filters and default salary range", () => {
    const onChange = jest.fn();
    render(
      <FilterSidebar
        {...defaultProps}
        filters={{ ...defaultFilters, skills: ["Python"], location: "Canada" }}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText("Clear all"));
    expect(onChange).toHaveBeenCalledWith({
      search: "",
      skills: [],
      location: "",
      education: "",
      salaryMin: salaryRange.min,
      salaryMax: salaryRange.max,
    });
  });
});

describe("FilterSidebar — salary sliders", () => {
  it("salary min slider calls onChange when changed", () => {
    const onChange = jest.fn();
    render(<FilterSidebar {...defaultProps} onChange={onChange} />);
    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "60000" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("salary max slider calls onChange when changed", () => {
    const onChange = jest.fn();
    render(<FilterSidebar {...defaultProps} onChange={onChange} />);
    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[1], { target: { value: "100000" } });
    expect(onChange).toHaveBeenCalled();
  });
});
