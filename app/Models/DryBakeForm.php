<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DryBakeForm extends Model
{
    protected $table = 'dbakeformtable';
    protected $primaryKey = 'id';
    public $incrementing = true;

    public $timestamps = false;

    protected $fillable = [
        'oven_num',
        'lotid',
        'package',
        'partname',
        'quantity',
        'chamber',
        'input_type',
        'approved_status',
        'temperature',
        'hours',
        'date_time_in',
        'operator_in',
        'date_time_out',
        'old_date_time_out',
        'confirmed_data',
        'operator_out',
        'bake_status',
        'approved_by',
        'added_by',
        'cooldown_by',
        'cooldown_end',
        'date_created',
    ];

    // 🔥 Auto casting (important!)
    protected $casts = [
        'hours' => 'float',
        'confirmed_data' => 'boolean',
        'date_time_in' => 'datetime',
        'date_time_out' => 'datetime',
        'old_date_time_out' => 'datetime',
        'cooldown_end' => 'datetime',
    ];
}
