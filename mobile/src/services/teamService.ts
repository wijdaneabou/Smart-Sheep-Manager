import api from "./api";

// --- Types ---

export type Employee = {
  id: number;
  exploitationId: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  position: string;
  status: "ACTIVE" | "INACTIVE";
};

export type LabourCosts = {
  month: string;
  totalHours: number;
  totalCost: number;
  employees: {
    employeeId: number;
    name: string;
    totalHours: number;
    hourlyRate: number;
    cost: number;
  }[];
};

// --- Helper ---

function errorMessage(error: any): string {
  if (typeof error?.response?.data?.error === "string") {
    return error.response.data.error;
  }
  return error?.response?.data?.message ?? "Impossible de contacter le serveur.";
}

// --- Employés ---

export async function listEmployees(exploitationId: number) {
  try {
    const response = await api.get<{ data: Employee[] }>("/teams/employees", {
      params: { exploitationId },
    });
    return { success: true as const, data: response.data.data };
  } catch (error) {
    return { success: false as const, message: errorMessage(error) };
  }
}

export async function createEmployee(
  input: Omit<Employee, "id" | "phone" | "email"> & {
    phone?: string;
    email?: string;
  }
) {
  try {
    const response = await api.post<{ data: Employee }>("/teams/employees", input);
    return { success: true as const, data: response.data.data };
  } catch (error) {
    return { success: false as const, message: errorMessage(error) };
  }
}

// --- Contrats ---

export async function createContract(input: {
  employeeId: number;
  type: "CDI" | "CDD" | "TEMPORAIRE" | "SAISONNIER";
  startDate: string;
  endDate?: string;
  hourlyRate: number;
  monthlySalary?: number;
}) {
  try {
    await api.post("/teams/contracts", input);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, message: errorMessage(error) };
  }
}

// --- Plannings ---

export async function createSchedule(input: {
  employeeId: number;
  workDate: string;
  startTime: string;
  endTime: string;
  task: string;
}) {
  try {
    await api.post("/teams/schedules", input);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, message: errorMessage(error) };
  }
}

// --- Heures travaillées ---

export async function createHours(input: {
  employeeId: number;
  workDate: string;
  hours: number;
  overtimeHours?: number;
  note?: string;
}) {
  try {
    await api.post("/teams/hours", input);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, message: errorMessage(error) };
  }
}

// --- Coûts de main-d'œuvre ---

export async function labourCosts(exploitationId: number, month: string) {
  try {
    const response = await api.get<{ data: LabourCosts }>("/teams/costs", {
      params: { exploitationId, month },
    });
    return { success: true as const, data: response.data.data };
  } catch (error) {
    return { success: false as const, message: errorMessage(error) };
  }
}