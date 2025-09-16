<?php 
// app/Models/Measurement.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Measurement extends Model {
    protected $fillable = ['user_id','date','type','value'];
    protected $casts = ['date' => 'date'];
    public function user(){ return $this->belongsTo(\App\Models\User::class); }
}
