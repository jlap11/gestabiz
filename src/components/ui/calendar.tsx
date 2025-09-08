import { ComponentProps } from "react"
import { es } from 'date-fns/locale'
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={{ ...es, options: { weekStartsOn: 1 } }}
      className={cn("p-4 bg-white dark:bg-gray-900 border rounded-xl shadow-lg", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-between items-center px-3 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg mb-4",
        caption_label: "text-lg font-semibold text-gray-900 dark:text-white tracking-wide",
        nav: "flex items-center space-x-2",
        nav_button: cn(
          "h-9 w-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 flex items-center justify-center"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-2",
        head_cell: "text-gray-600 dark:text-gray-300 rounded-lg flex-1 font-medium text-sm text-center py-3 bg-gray-50 dark:bg-gray-800 mx-0.5 first:ml-0 last:mr-0",
        row: "flex w-full mb-1",
        cell: "flex-1 text-center p-0 focus-within:relative focus-within:z-20 mx-0.5 first:ml-0 last:mr-0",
        day: cn(
          "h-10 w-full p-0 font-medium text-gray-700 dark:text-gray-200 aria-selected:opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm cursor-pointer relative"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:from-blue-600 focus:to-blue-700 shadow-md border-blue-500 hover:shadow-lg transform hover:scale-105",
        day_today: "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600 font-bold shadow-sm",
        day_outside:
          "day-outside text-gray-400 dark:text-gray-500 opacity-40 aria-selected:bg-blue-500/10 aria-selected:text-blue-600 dark:aria-selected:text-blue-400 aria-selected:opacity-60",
        day_disabled: "text-gray-300 dark:text-gray-600 opacity-30 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 aria-selected:text-blue-700 dark:aria-selected:text-blue-300",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar }
