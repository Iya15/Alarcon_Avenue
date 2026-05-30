<?php

namespace App\DTOs;

class RefundResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?string $refundId = null,
        public readonly ?string $error = null,
    ) {}

    public static function ok(string $refundId): self
    {
        return new self(success: true, refundId: $refundId);
    }

    public static function fail(string $error): self
    {
        return new self(success: false, error: $error);
    }
}
