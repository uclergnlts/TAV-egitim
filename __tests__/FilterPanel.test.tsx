/**
 * FilterPanel Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterPanel, FilterField, FilterValue } from "@/components/FilterPanel";

const mockFields: FilterField[] = [
    { key: "name", label: "Name", type: "text", placeholder: "Enter name" },
    { key: "age", label: "Age", type: "number" },
    { key: "status", label: "Status", type: "select", options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
    ]},
    { key: "tags", label: "Tags", type: "multiselect", options: [
        { value: "tag1", label: "Tag 1" },
        { value: "tag2", label: "Tag 2" },
    ]},
    { key: "verified", label: "Verified", type: "boolean" },
    { key: "createdAt", label: "Created At", type: "date" },
];

describe("FilterPanel", () => {
    it("should render with collapsed state by default", () => {
        render(
            <FilterPanel
                fields={mockFields}
                filters={[]}
                onChange={vi.fn()}
                onApply={vi.fn()}
                onReset={vi.fn()}
            />
        );

        expect(screen.getByText("Filtreler")).toBeInTheDocument();
        expect(screen.queryByText("Yeni Filtre Ekle")).not.toBeInTheDocument();
    });

    it("should expand when clicked", () => {
        render(
            <FilterPanel
                fields={mockFields}
                filters={[]}
                onChange={vi.fn()}
                onApply={vi.fn()}
                onReset={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Filtreler"));
        expect(screen.getByText("Yeni Filtre Ekle")).toBeInTheDocument();
    });

    it("should display filter count badge", () => {
        const filters: FilterValue[] = [
            { field: "name", operator: "contains", value: "John" },
        ];

        render(
            <FilterPanel
                fields={mockFields}
                filters={filters}
                onChange={vi.fn()}
                onApply={vi.fn()}
                onReset={vi.fn()}
            />
        );

        expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("should add a filter", () => {
        const onChange = vi.fn();

        render(
            <FilterPanel
                fields={mockFields}
                filters={[]}
                onChange={onChange}
                onApply={vi.fn()}
                onReset={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Filtreler"));
        
        // Enter filter value
        const valueInput = screen.getByPlaceholderText("Enter name");
        fireEvent.change(valueInput, { target: { value: "John" } });

        // Add filter
        fireEvent.click(screen.getByText("Filtre Ekle"));

        expect(onChange).toHaveBeenCalledWith([
            { field: "name", operator: "eq", value: "John" },
        ]);
    });

    it("should remove a filter", () => {
        const filters: FilterValue[] = [
            { field: "name", operator: "contains", value: "John" },
        ];
        const onChange = vi.fn();

        render(
            <FilterPanel
                fields={mockFields}
                filters={filters}
                onChange={onChange}
                onApply={vi.fn()}
                onReset={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Filtreler"));
        
        // Find and click remove button
        const removeButton = screen.getByRole("button", { name: /filtreyi kaldır/i });
        fireEvent.click(removeButton);

        expect(onChange).toHaveBeenCalledWith([]);
    });

    it("should call onApply when apply button clicked", () => {
        const onApply = vi.fn();

        render(
            <FilterPanel
                fields={mockFields}
                filters={[]}
                onChange={vi.fn()}
                onApply={onApply}
                onReset={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Filtreler"));
        fireEvent.click(screen.getByText("Uygula"));

        expect(onApply).toHaveBeenCalled();
    });

    it("should call onReset when reset button clicked", () => {
        const onReset = vi.fn();
        const filters: FilterValue[] = [
            { field: "name", operator: "contains", value: "John" },
        ];

        render(
            <FilterPanel
                fields={mockFields}
                filters={filters}
                onChange={vi.fn()}
                onApply={vi.fn()}
                onReset={onReset}
            />
        );

        fireEvent.click(screen.getByText("Filtreler"));
        fireEvent.click(screen.getByText("Sıfırla"));

        expect(onReset).toHaveBeenCalled();
    });

    it("should disable reset button when no filters", () => {
        render(
            <FilterPanel
                fields={mockFields}
                filters={[]}
                onChange={vi.fn()}
                onApply={vi.fn()}
                onReset={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Filtreler"));
        const resetButton = screen.getByText("Sıfırla");
        
        expect(resetButton).toBeDisabled();
    });

    it("should show loading state", () => {
        render(
            <FilterPanel
                fields={mockFields}
                filters={[]}
                onChange={vi.fn()}
                onApply={vi.fn()}
                onReset={vi.fn()}
                loading={true}
            />
        );

        fireEvent.click(screen.getByText("Filtreler"));
        expect(screen.getByText("Uygulanıyor...")).toBeInTheDocument();
    });

    it("should handle boolean filter type", () => {
        const onChange = vi.fn();

        render(
            <FilterPanel
                fields={mockFields}
                filters={[]}
                onChange={onChange}
                onApply={vi.fn()}
                onReset={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Filtreler"));
        
        // Change field to boolean
        const fieldSelect = screen.getByLabelText("Filtre alanı");
        fireEvent.change(fieldSelect, { target: { value: "verified" } });

        // Boolean should only have "eq" operator
        const operatorSelect = screen.getByLabelText("Operatör");
        expect(operatorSelect.children.length).toBe(1);
    });

    it("should handle date filter type", () => {
        render(
            <FilterPanel
                fields={mockFields}
                filters={[]}
                onChange={vi.fn()}
                onApply={vi.fn()}
                onReset={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Filtreler"));
        
        // Change field to date
        const fieldSelect = screen.getByLabelText("Filtre alanı");
        fireEvent.change(fieldSelect, { target: { value: "createdAt" } });

        // Should show date input
        const dateInput = screen.getByLabelText("Değer");
        expect(dateInput).toHaveAttribute("type", "date");
    });
});
