import { ContractStatus, STATUS_CONFIG } from '@/lib/types';

interface StatusBadgeProps {
    status: ContractStatus;
    size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status];

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
    };

    return (
        <span
            className={`inline-flex items-center font-medium rounded-full ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
        >
            {config.label}
        </span>
    );
}
