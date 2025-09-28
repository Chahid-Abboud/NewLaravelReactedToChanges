<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlacesLocalSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            // --- Gyms (15) ---
            ['Olympia Gym Jounieh','gym',33.980500,35.640200,'Main Hwy, Jounieh','Jounieh'],
            ['Fitness Zone Zouk Mosbeh','gym',33.955900,35.619800,'Zouk Mosbeh Highway','Zouk Mosbeh'],
            ['Shape Up Gym Zouk Mikael','gym',33.967600,35.615300,'Zouk Mikael Main Road','Zouk Mikael'],
            ['Body Garage Kaslik','gym',33.980900,35.629900,'Kaslik Main Road','Kaslik'],
            ['U Energy Dbayeh','gym',33.939700,35.585800,'Dbayeh Highway','Dbayeh'],
            ['Black Belt Gym Zalka','gym',33.907300,35.574800,'Zalka Highway','Zalka'],
            ['Gold Fitness Antelias','gym',33.916900,35.579900,'Antelias Main Street','Antelias'],
            ['Byblos Gym','gym',34.121400,35.651200,'Byblos Old Town','Jbeil'],
            ['Spartan Fitness Adonis','gym',33.964500,35.617200,'Adonis Highway','Adonis'],
            ['Titanium Gym Jounieh','gym',33.981200,35.629500,'Kaslik Area','Jounieh'],
            ['Energy Club Dbayeh','gym',33.939300,35.585200,'Dbayeh Seaside','Dbayeh'],
            ['Hard Rock Gym Zouk','gym',33.962800,35.615700,'Zouk Area','Zouk Mikael'],
            ['Impact Gym Jbeil','gym',34.120800,35.649700,'Byblos Highway','Jbeil'],
            ['Pro Gym Antelias','gym',33.917900,35.580900,'Antelias Main Road','Antelias'],
            ['Extreme Fitness Zalka','gym',33.906900,35.573900,'Zalka Boulevard','Zalka'],

            // --- Nutritionists (15) ---
            ['Diet Center Jounieh','nutritionist',33.977800,35.630700,'Kaslik/Jounieh Hwy','Jounieh'],
            ['Nutri Clinic Jbeil','nutritionist',34.121900,35.650300,'Byblos Center','Jbeil'],
            ['Healthy Bites Nutrition Zouk','nutritionist',33.962100,35.615800,'Zouk Mikael','Zouk Mikael'],
            ['Diet & More Zalka','nutritionist',33.907900,35.575900,'Zalka Main Road','Zalka'],
            ['Wellness Clinic Dbayeh','nutritionist',33.942500,35.587900,'Dbayeh Village','Dbayeh'],
            ['Slim & Healthy Antelias','nutritionist',33.917800,35.579200,'Antelias Main Road','Antelias'],
            ['Nutrition Experts Kaslik','nutritionist',33.981700,35.628900,'Kaslik Highway','Kaslik'],
            ['Lebanon Diet Clinic Jounieh','nutritionist',33.979500,35.631500,'Jounieh Main Street','Jounieh'],
            ['NutriHealth Zouk','nutritionist',33.963400,35.616700,'Zouk Area','Zouk Mikael'],
            ['Optimal Nutrition Jbeil','nutritionist',34.122500,35.652000,'Byblos Souks','Jbeil'],
            ['Vitality Nutrition Zalka','nutritionist',33.906300,35.574500,'Zalka Highway','Zalka'],
            ['NutriFit Clinic Dbayeh','nutritionist',33.940800,35.586200,'Dbayeh Area','Dbayeh'],
            ['Life Nutrition Antelias','nutritionist',33.918900,35.581500,'Antelias Main Road','Antelias'],
            ['NutriBalance Kaslik','nutritionist',33.980200,35.629400,'Kaslik Center','Kaslik'],
            ['Wellbeing Nutrition Jounieh','nutritionist',33.978200,35.632000,'Seaside Rd, Jounieh','Jounieh'],
        ];

        foreach ($rows as $r) {
            DB::table('places_local')->insert([
                'name'       => $r[0],
                'category'   => $r[1],
                'lat'        => $r[2],
                'lng'        => $r[3],
                'address'    => $r[4],
                'city'       => $r[5],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
