import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  TransactionCategoryOption,
  TransactionFilters as TransactionFiltersValues,
} from "@/lib/types/finance";

type TransactionFiltersProps = {
  categories: TransactionCategoryOption[];
  filters: TransactionFiltersValues;
};

export function TransactionFilters({
  categories,
  filters,
}: TransactionFiltersProps) {
  return (
    <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,220px)]">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="type">
          Type
        </label>
        <Select defaultValue={filters.type} id="type" name="type">
          <option value="all">All types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </Select>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-slate-700"
          htmlFor="categoryId"
        >
          Category
        </label>
        <Select defaultValue={filters.categoryId} id="categoryId" name="categoryId">
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.type === "expense" ? "Expense" : "Income"} · {category.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-slate-700"
          htmlFor="dateFrom"
        >
          From
        </label>
        <Input defaultValue={filters.dateFrom} id="dateFrom" name="dateFrom" type="date" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="dateTo">
          To
        </label>
        <Input defaultValue={filters.dateTo} id="dateTo" name="dateTo" type="date" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="sort">
          Sort
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select className="w-full min-w-0" defaultValue={filters.sort} id="sort" name="sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
          <Button className="w-full sm:min-w-[100px] sm:w-auto" type="submit">
            Apply
          </Button>
        </div>
      </div>
    </form>
  );
}
