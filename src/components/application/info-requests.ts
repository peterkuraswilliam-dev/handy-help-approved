export const INFO_SECTIONS: { key: string; label: string }[] = [
  { key: "business_details", label: "Business details" },
  { key: "contact_details", label: "Contact details" },
  { key: "services", label: "Services" },
  { key: "areas", label: "Areas covered" },
  { key: "business_description", label: "Business description" },
  { key: "website_facebook", label: "Website or Facebook page" },
  { key: "work_photos", label: "Work photos" },
  { key: "insurance_information", label: "Insurance information" },
  { key: "qualifications", label: "Qualifications" },
  { key: "references", label: "References" },
];

export const INFO_DOCUMENTS: { key: string; label: string }[] = [
  { key: "insurance_document", label: "Insurance document" },
  { key: "qualification_documents", label: "Qualification documents" },
  { key: "business_logo", label: "Business logo" },
  { key: "work_photos", label: "Work photos" },
];

export type InfoRequestRow = {
  id: string;
  application_id: string;
  message: string;
  requested_sections: string[] | null;
  requested_documents: string[] | null;
  requested_by: string;
  requested_at: string;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  closed_at?: string | null;
  response_message?: string | null;
  responded_at?: string | null;
  resubmitted_at?: string | null;
};

export function labelFor(list: { key: string; label: string }[], key: string) {
  return list.find((i) => i.key === key)?.label ?? key;
}
