<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SmartDacService
{
    public function getTemperatures(): array
    {
        $response = Http::timeout(5)
            ->get('http://192.168.1.180/gene.cgi', [
                'msg' => 'FData,0'
            ]);

        if ($response->failed()) {
            return [];
        }

        $lines = explode("\n", $response->body());
        $channels = [];

        foreach ($lines as $line) {

            if (preg_match('/([NO])\s+(\d+).*?([+-]\d+)E-01/', trim($line), $m)) {

                $status = $m[1];
                $channel = $m[2];
                $raw = (int) $m[3];

                $temp = $raw / 10;

                $isValid = true;

                if ($temp < -1000 || $temp == -999999.9) {
                    $temp = null;
                    $isValid = false;
                }

                $channels[] = [
                    "channel" => $channel,
                    "status" => $status,
                    "temperature" => $temp,
                    "is_valid" => $isValid
                ];
            }
        }

        return $channels;
    }
}
