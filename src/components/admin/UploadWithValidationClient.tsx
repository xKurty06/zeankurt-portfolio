"use client";

import dynamic from "next/dynamic";
import React from "react";

const UploadWithValidation = dynamic(() => import("./UploadWithValidation"), { ssr: false });

export default function UploadWithValidationClient(props: any) {
  return <UploadWithValidation {...props} />;
}
