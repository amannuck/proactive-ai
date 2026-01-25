import React, { createContext, useContext, useState, useEffect } from "react";
import budgetData from "@/data/budget.json";

interface MonthlySpending {
  month: string;
  remaining: number;
  spent: number;
}

interface BudgetContextType {
  annualBudget: number;
  setAnnualBudget: (budget: number) => void;
  historicalSpending: MonthlySpending[];
  currentYearSpending: MonthlySpending[];
  currentMonth: number;
  approvePurchase: (amount: number) => void;
  remainingBudget: number;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [annualBudget, setAnnualBudget] = useState<number>(budgetData.defaultAnnualBudget);
  const [historicalSpending, setHistoricalSpending] = useState<MonthlySpending[]>(budgetData.historicalSpending);
  const [currentYearSpending, setCurrentYearSpending] = useState<MonthlySpending[]>(budgetData.currentYearSpending);
  const [currentMonth] = useState<number>(budgetData.currentMonth);

  useEffect(() => {
    // Calculate cumulative spending for historical data
    let cumulativeHistorical = 0;
    const scaledHistorical = budgetData.historicalSpending.map((item) => {
      cumulativeHistorical += item.spent * (annualBudget / budgetData.defaultAnnualBudget);
      return {
        ...item,
        remaining: annualBudget - cumulativeHistorical,
        spent: item.spent * (annualBudget / budgetData.defaultAnnualBudget),
      };
    });
    setHistoricalSpending(scaledHistorical);

    // Calculate cumulative spending for current year data
    let cumulativeCurrent = 0;
    const scaledCurrent = budgetData.currentYearSpending.map((item) => {
      cumulativeCurrent += item.spent * (annualBudget / budgetData.defaultAnnualBudget);
      return {
        ...item,
        remaining: annualBudget - cumulativeCurrent,
        spent: item.spent * (annualBudget / budgetData.defaultAnnualBudget),
      };
    });
    setCurrentYearSpending(scaledCurrent);
  }, [annualBudget]);

  const approvePurchase = (amount: number) => {
    setCurrentYearSpending((prev) => {
      const updated = [...prev];
      for (let i = currentMonth; i < updated.length; i++) {
        updated[i] = {
          ...updated[i],
          remaining: updated[i].remaining - amount,
          spent: updated[i].spent + (i === currentMonth ? amount : 0),
        };
      }
      return updated;
    });
  };

  const remainingBudget = currentYearSpending[currentMonth]?.remaining || annualBudget;

  return (
    <BudgetContext.Provider
      value={{
        annualBudget,
        setAnnualBudget,
        historicalSpending,
        currentYearSpending,
        currentMonth,
        approvePurchase,
        remainingBudget,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
};
