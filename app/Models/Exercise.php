<?php
// app/Models/Exercise.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exercise extends Model
{
    protected $fillable = ['name','primary_muscle','equipment'];
}
