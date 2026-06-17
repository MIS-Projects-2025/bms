<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmartdacReading extends Model
{
    protected $fillable = [
        'channel',
        'status',
        'temperature',
        'is_valid',
        'recorded_at'
    ];
}
