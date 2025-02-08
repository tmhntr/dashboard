import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Input } from "./components/ui/input";
import React from "react";
import {
  queryDataRowsFromIndexedDB,
  Container,
  DataRow,
  loadExcelFileAndSaveToIndexedDB,
} from "@/lib/data";
import { addMonths } from "date-fns";
import { CalendarDatePicker } from "./components/calendar-date-picker";
import ControlsCard from "./components/ControlsCard";
import DosesCard from "./components/DosesCard";
import DispenseAccuracyCard from "./components/DispenseAccuracyCard";
import DispenseTimeCard from "./components/DispenseTimeCard";
import { products } from "./lib/products";
import DispenseTimesHistogram from "./components/DispenseTimesHistogram";
import AverageDispenseTimesCard from "./components/AverageDispenseTimesCard";

type Window = "1 month" | "3 months" | "6 months";
export const window_length: Window = "6 months";

export default function DashboardPage() {
  const [data, setData] = React.useState<DataRow[]>([]);
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(Date.now())
  );
  const [selectedProduct, setSelectedProduct] = React.useState<
    string | undefined
  >(undefined);
  const [selectedContainer, setSelectedContainer] = React.useState<
    Container | undefined
  >(undefined);
  React.useEffect(() => {
    // console log all unique product_name
    (async () => {
      setData(
        await queryDataRowsFromIndexedDB({
          product: selectedProduct,
          container: selectedContainer,
          filled_datetime: date && {
            end: date?.toISOString(),
            start: addMonths(date, -6).toISOString(),
          },
        })
      );
      // console.log(data);
    })();
  }, [selectedProduct, selectedContainer, data, date]);
  const totalDosesOnDate = data.filter(
    (row) =>
      new Date(row.filled_datetime).toDateString() === date?.toDateString()
  ).length;
  const averageDosesPerDay =
    data.length /
    new Set(data.map((row) => new Date(row.filled_datetime).toDateString()))
      .size;

  const avgDispenseTimeOnDate =
    data
      .filter(
        (row) =>
          new Date(row.filled_datetime).toDateString() === date?.toDateString()
      )
      .reduce((acc, row) => {
        if (row.dispense_time) {
          return acc + row.dispense_time;
        } else {
          return acc;
        }
      }, 0) / totalDosesOnDate;
  const avgDispenseTime =
    data.reduce((acc, row) => {
      if (row.dispense_time) {
        return acc + row.dispense_time;
      } else {
        return acc;
      }
    }, 0) / data.length;

  const avgDispenseAccuracyOnDate =
    data
      .filter(
        (row) =>
          new Date(row.filled_datetime).toDateString() === date?.toDateString()
      )
      .reduce((acc, row) => {
        return acc + (row.activity_error || 0);
      }, 0) / totalDosesOnDate;
  const avgDispenseAccuracy =
    data.reduce((acc, row) => {
      return acc + (row.activity_error || 0);
    }, 0) / data.length;

  return (
    <>
      <div className="md:hidden">
        <img
          src="/examples/dashboard-light.png"
          width={1280}
          height={866}
          alt="Dashboard"
          className="block dark:hidden"
        />
        <img
          src="/examples/dashboard-dark.png"
          width={1280}
          height={866}
          alt="Dashboard"
          className="hidden dark:block"
        />
      </div>
      <div className="hidden flex-col md:flex">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            {/* <TeamSwitcher /> */}
            {/* <MainNav className="mx-6" /> */}
            <div className="ml-auto flex items-center space-x-4">
              {/* <Search /> */}
              {/* <UserNav /> */}
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
              <CalendarDatePicker
                date={{ from: date, to: date }}
                onDateSelect={({ from }) => {
                  setDate(from);
                }}
                variant="outline"
                numberOfMonths={1}
                className="min-w-[250px]"
              />
              <Input
                id="file"
                type="file"
                onChange={async (e) => {
                  console.log(e.target.files);
                  if (e.target.files) {
                    const file = e.target.files[0];
                    await loadExcelFileAndSaveToIndexedDB(file);
                    setData(await queryDataRowsFromIndexedDB({}));
                  }
                }}
              />
            </div>
          </div>
          <Tabs defaultValue="dispensing" className="space-y-4">
            <TabsList>
              <TabsTrigger value="dispensing">Dispensing</TabsTrigger>
              <TabsTrigger value="compounding" disabled>
                Compounding
              </TabsTrigger>
              <TabsTrigger value="qc" disabled>
                Quality Control
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dispensing" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ControlsCard
                  products={products}
                  setSelectedProduct={setSelectedProduct}
                  setSelectedContainer={setSelectedContainer}
                />
                <DosesCard
                  totalDosesOnDate={totalDosesOnDate}
                  averageDosesPerDay={averageDosesPerDay}
                />
                <DispenseTimeCard
                  avgDispenseTimeOnDate={avgDispenseTimeOnDate}
                  avgDispenseTime={avgDispenseTime}
                />
                <DispenseAccuracyCard
                  avgDispenseAccuracyOnDate={avgDispenseAccuracyOnDate}
                  avgDispenseAccuracy={avgDispenseAccuracy}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <AverageDispenseTimesCard data={data} />
                <DispenseTimesHistogram data={data} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
