<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssistantMessageRequest;
use App\Services\AssistantService;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AssistantController extends Controller
{
    public function __invoke(AssistantMessageRequest $request, AssistantService $service): StreamedResponse
    {
        $message = $request->validated('message');
        $history = $request->validated('history', []);

        return response()->stream(function () use ($service, $message, $history) {
            // Disable output buffering so chunks are sent immediately
            if (ob_get_level()) {
                ob_end_flush();
            }

            echo "data: \n\n"; // SSE keep-alive / open event
            flush();

            try {
                foreach ($service->stream($message, $history) as $chunk) {
                    // Escape newlines so each SSE event is a single line
                    $escaped = str_replace(["\r\n", "\n", "\r"], ' ', $chunk);
                    echo "data: " . json_encode(['text' => $chunk]) . "\n\n";
                    flush();
                }
            } catch (\Throwable $e) {
                echo "data: " . json_encode(['error' => 'Service unavailable. Please try again.']) . "\n\n";
                flush();
            }

            echo "data: [DONE]\n\n";
            flush();
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no', // disable Nginx proxy buffering
        ]);
    }
}
