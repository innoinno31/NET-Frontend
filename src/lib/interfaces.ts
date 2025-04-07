import { EquipmentStatus, CertificationSteps, DocumentType, DocumentStatus } from "./enums";
import { Address, Hash } from 'viem';

export interface Plant {
    id: bigint;
    name: string;
    description: string;
    location: string;
    registeredAt: bigint;
    isActive: boolean;
}

export interface Actor {
    id: bigint;
    name: string;
    actorAddress: Address;
    role: Hash;
    registeredAt: bigint;
    plantId: bigint;
}

export interface Equipment {
    id: bigint;
    name: string;
    description: string;
    currentStep: CertificationSteps;
    status: EquipmentStatus;
    registeredAt: bigint;
    certifiedAt: bigint;
    rejectedAt: bigint;
    pendingAt: bigint;
    deprecatedAt: bigint;
    finalCertificationHash: Hash;
    rejectionReason: string;
}

export interface Document {
    id: bigint;
    name: string;
    description: string;
    docType: DocumentType;
    status: DocumentStatus;
    submitter: Address;
    submittedAt: bigint;
    rejectedAt: bigint;
    pendingAt: bigint;
    deprecatedAt: bigint;
    ipfsHash: string;
}