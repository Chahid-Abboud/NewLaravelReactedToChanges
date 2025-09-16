<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDiet extends Model
{
    protected $fillable = ['user_id','diet_id','active_from','active_to'];
}
