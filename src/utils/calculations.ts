import { differenceInMonths, format, isSameMonth } from "date-fns";

export function calculateSalaryBreakdown(totalSalary: number) {
  const basicSalary = round(totalSalary * 0.5);
  const hra = round(totalSalary * 0.25);
  const medicalAllowance = round(totalSalary * 0.125);
  const travelAllowance = round(totalSalary * 0.05);

  return {
    basicSalary,
    hra,
    medicalAllowance,
    travelAllowance,
    others: round(totalSalary - basicSalary - hra - medicalAllowance - travelAllowance),
    festivalBonus: 0
  };
}

export function calculateDueAmount(loanAmount: number, paidAmount: number) {
  return round(loanAmount - paidAmount);
}

export function calculateDuration(joiningDate: string | Date) {
  const months = differenceInMonths(new Date(), new Date(joiningDate));
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years}y ${remainingMonths}m`;
}

export function getJoiningYear(joiningDate: string | Date) {
  return new Date(joiningDate).getFullYear();
}

export function getDayName(date: string | Date) {
  return format(new Date(date), "EEEE");
}

export function isBirthdayThisMonth(dateOfBirth: string | Date) {
  return isSameMonth(new Date(dateOfBirth), new Date());
}

export function isAnniversaryThisMonth(joiningDate: string | Date) {
  return isSameMonth(new Date(joiningDate), new Date());
}

export function getBirthdayWish(name: string, dateOfBirth: string | Date) {
  const date = new Date(dateOfBirth);
  const now = new Date();
  if (date.getMonth() === now.getMonth()) {
    return `Wish ${name} a happy birthday this month`;
  }
  return "-";
}

export function getAnniversaryWish(name: string, joiningDate: string | Date) {
  const date = new Date(joiningDate);
  const now = new Date();
  if (date.getMonth() === now.getMonth()) {
    return `Celebrate ${name}'s work anniversary`;
  }
  return "-";
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0
  }).format(amount ?? 0);
}

export function round(value: number) {
  return Number(value.toFixed(2));
}
