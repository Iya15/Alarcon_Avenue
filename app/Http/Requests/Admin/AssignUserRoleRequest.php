<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AssignUserRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'roles'   => ['present', 'array'],      // present but can be empty (strip all roles)
            'roles.*' => ['string', 'exists:roles,name'],
        ];
    }
}
