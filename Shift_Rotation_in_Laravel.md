## Shift Rotation in Laravel

I want to shift rotation like below:

- Week 1: A=06:00-14:00, B=14:00-22:00, C=22:00-06:00
- Week 2: B=06:00-14:00, C=14:00-22:00, A=22:00-06:00
- Week 3: C=06:00-14:00, A=14:00-22:00, B=22:00-06:00
- **Week 4: Back to Week 1 pattern**



### 1. Create Migration for Shift Calendar Table

```bash
php artisan make:migration create_shift_calendar_table
```


```php
<?php 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateShiftCalendarTable extends Migration
{
    public function up()
    {
        Schema::create('shift_calendar', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->unsignedBigInteger('working_shift_id');
            $table->unsignedBigInteger('branch_id');
            $table->string('shift_name');
            $table->time('shift_start');
            $table->time('shift_end');
            $table->date('base_date');
            $table->timestamps();

            $table->unique(['date', 'branch_id', 'working_shift_id']); // Unique per date, branch, and shift
            $table->foreign('working_shift_id')->references('id')->on('working_shifts')->onDelete('cascade');
            $table->index(['date', 'branch_id']);
            $table->index('branch_id');
            $table->index('date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('shift_calendar');
    }
}
```


### 2. Create Models

WorkingShift Model:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkingShift extends Model
{
    protected $table = 'working_shifts';
    
    protected $fillable = [
        'branch_id', 'name', 'shift_start', 'shift_end', 'base_date', 'created_by'
    ];

    public function shiftCalendars()
    {
        return $this->hasMany(ShiftCalendar::class, 'working_shift_id');
    }

    public function branch()
    {
        // Assuming you have a branches table
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
```
ShiftCalendar Model:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftCalendar extends Model
{
    protected $table = 'shift_calendar';
    
    protected $fillable = [
        'date', 'working_shift_id', 'branch_id', 'shift_name', 
        'shift_start', 'shift_end', 'base_date'
    ];

    protected $dates = ['date'];

    public function workingShift()
    {
        return $this->belongsTo(WorkingShift::class, 'working_shift_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
```



### 3. Create Shift Calendar Service

```php
<?php

namespace App\Services;

use App\Models\WorkingShift;
use App\Models\ShiftCalendar;
use Carbon\Carbon;

class ShiftCalendarService
{
    public function generateShiftCalendar($branchId, $startDate, $endDate)
    {
        // Get all shifts for the branch ordered by original shift_start
        $shifts = WorkingShift::where('branch_id', $branchId)
            ->orderBy('shift_start')
            ->get();

        if ($shifts->isEmpty()) {
            throw new \Exception("No shifts found for branch ID: {$branchId}");
        }

        $shiftCount = $shifts->count();
        $calendar = [];

        $currentDate = Carbon::parse($startDate);
        $endDate = Carbon::parse($endDate);

        // Find the base date (oldest base_date from shifts)
        $baseDate = $shifts->min('base_date');
        $baseCarbon = Carbon::parse($baseDate);

        while ($currentDate->lte($endDate)) {
            // Calculate weeks difference from base date
            $weeksDiff = $baseCarbon->diffInWeeks($currentDate);
            
            // Determine rotation offset for this week
            $rotationOffset = $weeksDiff % $shiftCount;
            
            // Get the rotated shifts for this week
            $rotatedShifts = $this->rotateShifts($shifts, $rotationOffset);
            
            // Create calendar entries for all shifts for this date
            foreach ($rotatedShifts as $originalShift) {
                $shiftCalendar = ShiftCalendar::updateOrCreate(
                    [
                        'date' => $currentDate->toDateString(),
                        'branch_id' => $branchId,
                        'working_shift_id' => $originalShift['original_shift']->id
                    ],
                    [
                        'shift_name' => $originalShift['original_shift']->name,
                        'shift_start' => $originalShift['rotated_start'],
                        'shift_end' => $originalShift['rotated_end'],
                        'base_date' => $originalShift['original_shift']->base_date,
                    ]
                );

                $calendar[] = $shiftCalendar;
            }

            $currentDate->addDay();
        }

        return $calendar;
    }

    /**
     * Rotate shifts based on the rotation offset
     * Each rotation moves all shifts forward by one time slot
     */
    private function rotateShifts($shifts, $rotationOffset)
    {
        $shiftCount = $shifts->count();
        $rotatedShifts = [];
        
        // Get the original time slots in order
        $timeSlots = [];
        foreach ($shifts as $shift) {
            $timeSlots[] = [
                'start' => $shift->shift_start,
                'end' => $shift->shift_end
            ];
        }
        
        // Assign rotated time slots to each original shift
        foreach ($shifts as $index => $shift) {
            // Calculate which time slot this shift gets after rotation
            $timeSlotIndex = ($index + $rotationOffset) % $shiftCount;
            
            $rotatedShifts[] = [
                'original_shift' => $shift,
                'rotated_start' => $timeSlots[$timeSlotIndex]['start'],
                'rotated_end' => $timeSlots[$timeSlotIndex]['end'],
                'rotation_offset' => $rotationOffset
            ];
        }
        
        return $rotatedShifts;
    }

    public function getCurrentRotation($branchId, $date = null)
    {
        $date = $date ? Carbon::parse($date) : Carbon::today();
        $shifts = WorkingShift::where('branch_id', $branchId)->orderBy('shift_start')->get();
        
        if ($shifts->isEmpty()) {
            return null;
        }
        
        $baseDate = $shifts->min('base_date');
        $baseCarbon = Carbon::parse($baseDate);
        $weeksDiff = $baseCarbon->diffInWeeks($date);
        
        return $weeksDiff % $shifts->count();
    }

    public function getShiftsForDate($branchId, $date)
    {
        return ShiftCalendar::where('branch_id', $branchId)
            ->where('date', $date)
            ->orderBy('shift_start')
            ->get();
    }

    public function getShiftCalendar($branchId, $startDate, $endDate)
    {
        return ShiftCalendar::where('branch_id', $branchId)
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date')
            ->orderBy('shift_start')
            ->get();
    }

    public function getMonthlyCalendar($branchId, $year, $month)
    {
        $startDate = Carbon::create($year, $month, 1);
        $endDate = $startDate->copy()->endOfMonth();

        return $this->getShiftCalendar($branchId, $startDate->toDateString(), $endDate->toDateString());
    }

    public function getWeeklyRotationPattern($branchId)
    {
        $shifts = WorkingShift::where('branch_id', $branchId)
            ->orderBy('shift_start')
            ->get();

        $shiftCount = $shifts->count();
        $pattern = [];

        for ($week = 0; $week < $shiftCount; $week++) {
            $rotatedShifts = $this->rotateShifts($shifts, $week);
            $pattern[$week] = $rotatedShifts;
        }

        return $pattern;
    }
}
```




### 4. Create Controller



```php
<?php

namespace App\Http\Controllers;

use App\Services\ShiftCalendarService;
use App\Models\WorkingShift;
use App\Models\Branch;
use App\Models\ShiftCalendar;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ShiftCalendarController extends Controller
{
    protected $shiftCalendarService;

    public function __construct(ShiftCalendarService $shiftCalendarService)
    {
        $this->shiftCalendarService = $shiftCalendarService;
    }

    public function index(Request $request)
    {
        $branches = Branch::all();
        $selectedBranch = $request->get('branch_id', $branches->first()->id ?? null);
        $selectedYear = $request->get('year', date('Y'));
        $selectedMonth = $request->get('month', date('m'));

        if ($selectedBranch) {
            $calendar = $this->shiftCalendarService->getMonthlyCalendar($selectedBranch, $selectedYear, $selectedMonth);
            
            // Group by date
            $dailyCalendar = $calendar->groupBy('date');
            
            // Get rotation pattern for display
            $rotationPattern = $this->shiftCalendarService->getWeeklyRotationPattern($selectedBranch);
            $currentRotation = $this->shiftCalendarService->getCurrentRotation($selectedBranch);
        } else {
            $dailyCalendar = collect();
            $rotationPattern = [];
            $currentRotation = 0;
        }

        return view('shift-calendar.index', compact(
            'branches',
            'selectedBranch',
            'selectedYear',
            'selectedMonth',
            'dailyCalendar',
            'rotationPattern',
            'currentRotation'
        ));
    }

    public function create()
    {
        $branches = Branch::all();
        return view('shift-calendar.create', compact('branches'));
    }

    public function generate(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        try {
            $calendar = $this->shiftCalendarService->generateShiftCalendar(
                $request->branch_id,
                $request->start_date,
                $request->end_date
            );

            return redirect()->route('shift-calendar.index', [
                'branch_id' => $request->branch_id
            ])->with('success', 'Shift calendar generated successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function show($id)
    {
        $shiftCalendar = ShiftCalendar::with(['workingShift', 'branch'])->findOrFail($id);
        return view('shift-calendar.show', compact('shiftCalendar'));
    }

    public function dailyView(Request $request)
    {
        $selectedDate = $request->get('date', date('Y-m-d'));
        $selectedBranch = $request->get('branch_id');
        $branches = Branch::all();

        if ($selectedBranch) {
            $shifts = $this->shiftCalendarService->getShiftsForDate($selectedBranch, $selectedDate);
        } else {
            $shifts = collect();
        }

        return view('shift-calendar.daily', compact('shifts', 'selectedDate', 'selectedBranch', 'branches'));
    }

    public function rotationPattern(Request $request)
    {
        $branches = Branch::all();
        $selectedBranch = $request->get('branch_id', $branches->first()->id ?? null);
        
        if ($selectedBranch) {
            $rotationPattern = $this->shiftCalendarService->getWeeklyRotationPattern($selectedBranch);
            $shifts = WorkingShift::where('branch_id', $selectedBranch)->orderBy('shift_start')->get();
        } else {
            $rotationPattern = [];
            $shifts = collect();
        }

        return view('shift-calendar.rotation-pattern', compact(
            'branches',
            'selectedBranch',
            'rotationPattern',
            'shifts'
        ));
    }
}
```




### 5. Create Views

resources/views/shift-calendar/index.blade.php

```blade
@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-12">
            <h2>Shift Calendar</h2>
            
            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <form method="GET" action="{{ route('shift-calendar.index') }}">
                        <div class="row">
                            <div class="col-md-4">
                                <label for="branch_id">Branch</label>
                                <select name="branch_id" id="branch_id" class="form-control" onchange="this.form.submit()">
                                    <option value="">Select Branch</option>
                                    @foreach($branches as $branch)
                                        <option value="{{ $branch->id }}" {{ $selectedBranch == $branch->id ? 'selected' : '' }}>
                                            {{ $branch->name }}
                                        </option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="year">Year</label>
                                <select name="year" id="year" class="form-control" onchange="this.form.submit()">
                                    @for($i = date('Y') - 1; $i <= date('Y') + 1; $i++)
                                        <option value="{{ $i }}" {{ $selectedYear == $i ? 'selected' : '' }}>{{ $i }}</option>
                                    @endfor
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="month">Month</label>
                                <select name="month" id="month" class="form-control" onchange="this.form.submit()">
                                    @for($i = 1; $i <= 12; $i++)
                                        <option value="{{ $i }}" {{ $selectedMonth == $i ? 'selected' : '' }}>
                                            {{ date('F', mktime(0, 0, 0, $i, 1)) }}
                                        </option>
                                    @endfor
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label>&nbsp;</label><br>
                                <div class="btn-group">
                                    <a href="{{ route('shift-calendar.create') }}" class="btn btn-primary">Generate</a>
                                    <a href="{{ route('shift-calendar.rotation-pattern') }}?branch_id={{ $selectedBranch }}" 
                                       class="btn btn-info">Rotation Pattern</a>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            @if($selectedBranch)
                <!-- Current Rotation Info -->
                <div class="alert alert-info mb-4">
                    <strong>Current Rotation Week:</strong> Week {{ $currentRotation + 1 }} of {{ count($rotationPattern) }}
                </div>

                <!-- Calendar Display -->
                @if($dailyCalendar->isNotEmpty())
                    <div class="card">
                        <div class="card-header">
                            <h4>Shift Schedule for {{ date('F Y', mktime(0, 0, 0, $selectedMonth, 1, $selectedYear)) }}</h4>
                            <small>All three shifts exist daily with rotating time slots</small>
                        </div>
                        <div class="card-body">
                            @foreach($dailyCalendar as $date => $shifts)
                                <div class="day-container mb-4 border-bottom pb-3">
                                    <h5 class="text-primary">
                                        {{ Carbon\Carbon::parse($date)->format('Y-m-d (l)') }}
                                        <small class="text-muted">
                                            - Rotation Week: {{ $this->getCurrentRotation($selectedBranch, $date) + 1 }}
                                        </small>
                                    </h5>
                                    <div class="table-responsive">
                                        <table class="table table-bordered table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Shift Name</th>
                                                    <th>Start Time</th>
                                                    <th>End Time</th>
                                                    <th>Original Time Slot</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @foreach($shifts->sortBy('shift_start') as $shift)
                                                    <tr>
                                                        <td>
                                                            <span class="badge badge-primary">{{ $shift->shift_name }}</span>
                                                        </td>
                                                        <td>{{ $shift->shift_start }}</td>
                                                        <td>{{ $shift->shift_end }}</td>
                                                        <td>
                                                            <small class="text-muted">
                                                                @php
                                                                    $originalShift = \App\Models\WorkingShift::find($shift->working_shift_id);
                                                                @endphp
                                                                {{ $originalShift->shift_start }} - {{ $originalShift->shift_end }}
                                                            </small>
                                                        </td>
                                                        <td>
                                                            <a href="{{ route('shift-calendar.show', $shift->id) }}" class="btn btn-sm btn-info">View</a>
                                                        </td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @else
                    <div class="alert alert-warning">
                        No shift calendar found for this branch. 
                        <a href="{{ route('shift-calendar.create') }}">Generate calendar</a>
                    </div>
                @endif
            @else
                <div class="alert alert-info">
                    Please select a branch to view the shift calendar.
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
```


resources/views/shift-calendar/create.blade.php

```blade

@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">Generate Shift Calendar</div>

                <div class="card-body">
                    <form method="POST" action="{{ route('shift-calendar.generate') }}">
                        @csrf

                        <div class="form-group">
                            <label for="branch_id">Branch</label>
                            <select name="branch_id" id="branch_id" class="form-control" required>
                                <option value="">Select Branch</option>
                                @foreach($branches as $branch)
                                    <option value="{{ $branch->id }}">{{ $branch->name }}</option>
                                @endforeach
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="start_date">Start Date</label>
                            <input type="date" name="start_date" id="start_date" class="form-control" 
                                   value="{{ date('Y-m-d') }}" required>
                        </div>

                        <div class="form-group">
                            <label for="end_date">End Date</label>
                            <input type="date" name="end_date" id="end_date" class="form-control" 
                                   value="{{ date('Y-m-d', strtotime('+1 year')) }}" required>
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">Generate Calendar</button>
                            <a href="{{ route('shift-calendar.index') }}" class="btn btn-secondary">Cancel</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
```


resources/views/shift-calendar/show.blade.php

```blade
@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">Shift Details</div>

                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-4"><strong>Date:</strong></div>
                        <div class="col-md-8">{{ $shiftCalendar->date->format('Y-m-d (l)') }}</div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-4"><strong>Shift Name:</strong></div>
                        <div class="col-md-8">
                            <span class="badge badge-primary">{{ $shiftCalendar->shift_name }}</span>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-4"><strong>Start Time:</strong></div>
                        <div class="col-md-8">{{ $shiftCalendar->shift_start }}</div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-4"><strong>End Time:</strong></div>
                        <div class="col-md-8">{{ $shiftCalendar->shift_end }}</div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-4"><strong>Branch:</strong></div>
                        <div class="col-md-8">{{ $shiftCalendar->branch->name ?? 'N/A' }}</div>
                    </div>
                    
                    <div class="text-center">
                        <a href="{{ route('shift-calendar.index') }}" class="btn btn-secondary">Back to Calendar</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
```

resources/views/shift-calendar/daily.blade.php

```blade
@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-12">
            <h2>Daily Shift View</h2>
            
            <div class="card mb-4">
                <div class="card-body">
                    <form method="GET" action="{{ route('shift-calendar.daily') }}">
                        <div class="row">
                            <div class="col-md-4">
                                <label for="date">Select Date</label>
                                <input type="date" name="date" id="date" class="form-control" 
                                       value="{{ $selectedDate }}" onchange="this.form.submit()">
                            </div>
                            <div class="col-md-4">
                                <label>&nbsp;</label><br>
                                <a href="{{ route('shift-calendar.index') }}" class="btn btn-secondary">Back to Monthly View</a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            @if($shifts->isNotEmpty())
                <div class="card">
                    <div class="card-header">
                        <h4>Shifts for {{ Carbon\Carbon::parse($selectedDate)->format('Y-m-d (l)') }}</h4>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th>Branch</th>
                                        <th>Shift Name</th>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($shifts as $shift)
                                        <tr>
                                            <td>{{ $shift->branch->name ?? 'N/A' }}</td>
                                            <td>
                                                <span class="badge badge-primary">{{ $shift->shift_name }}</span>
                                            </td>
                                            <td>{{ $shift->shift_start }}</td>
                                            <td>{{ $shift->shift_end }}</td>
                                            <td>
                                                <a href="{{ route('shift-calendar.show', $shift->id) }}" class="btn btn-sm btn-info">View</a>
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            @else
                <div class="alert alert-warning">
                    No shifts found for {{ $selectedDate }}.
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
```
### 5. Add Rotation Pattern View

resources/views/shift-calendar/rotation-pattern.blade.php


```blade
@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-12">
            <h2>Shift Rotation Pattern</h2>
            
            <div class="card mb-4">
                <div class="card-body">
                    <form method="GET" action="{{ route('shift-calendar.rotation-pattern') }}">
                        <div class="row">
                            <div class="col-md-6">
                                <label for="branch_id">Branch</label>
                                <select name="branch_id" id="branch_id" class="form-control" onchange="this.form.submit()">
                                    <option value="">Select Branch</option>
                                    @foreach($branches as $branch)
                                        <option value="{{ $branch->id }}" {{ $selectedBranch == $branch->id ? 'selected' : '' }}>
                                            {{ $branch->name }}
                                        </option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label>&nbsp;</label><br>
                                <a href="{{ route('shift-calendar.index') }}" class="btn btn-secondary">Back to Calendar</a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            @if($selectedBranch && !empty($rotationPattern))
                <div class="card">
                    <div class="card-header">
                        <h4>Weekly Rotation Pattern</h4>
                        <p class="mb-0">This pattern repeats every {{ count($rotationPattern) }} weeks</p>
                    </div>
                    <div class="card-body">
                        @foreach($rotationPattern as $week => $shifts)
                            <div class="week-pattern mb-4 border-bottom pb-3">
                                <h5 class="text-success">Week {{ $week + 1 }}</h5>
                                <div class="table-responsive">
                                    <table class="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Shift</th>
                                                <th>Time Slot</th>
                                                <th>Original Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @foreach($shifts as $shift)
                                                <tr>
                                                    <td>
                                                        <strong>{{ $shift['original_shift']->name }}</strong>
                                                    </td>
                                                    <td>
                                                        {{ $shift['rotated_start'] }} - {{ $shift['rotated_end'] }}
                                                    </td>
                                                    <td class="text-muted">
                                                        {{ $shift['original_shift']->shift_start }} - {{ $shift['original_shift']->shift_end }}
                                                    </td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>
            @elseif($selectedBranch)
                <div class="alert alert-warning">
                    No rotation pattern found. Please generate the calendar first.
                </div>
            @else
                <div class="alert alert-info">
                    Please select a branch to view the rotation pattern.
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
```


### 6. Add Web Routes

routes/web.php

```php
Route::prefix('shift-calendar')->group(function () {
    Route::get('/', [ShiftCalendarController::class, 'index'])->name('shift-calendar.index');
    Route::get('/create', [ShiftCalendarController::class, 'create'])->name('shift-calendar.create');
    Route::post('/generate', [ShiftCalendarController::class, 'generate'])->name('shift-calendar.generate');
    Route::post('/generate-all', [ShiftCalendarController::class, 'generateAll'])->name('shift-calendar.generate-all');
    Route::get('/{id}', [ShiftCalendarController::class, 'show'])->name('shift-calendar.show');
    Route::get('/daily/view', [ShiftCalendarController::class, 'dailyView'])->name('shift-calendar.daily'); 
    Route::get('/rotation-pattern', [ShiftCalendarController::class, 'rotationPattern'])->name('rotation-pattern');
});
```


### How It Works Now:

- All 3 shifts exist every day - A, B, and C are all present daily

- Weekly rotation - Each week, the time slots rotate among the shifts

- 3-week cycle - The pattern repeats every 3 weeks

**Example Rotation:**

- Week 1: A=06:00-14:00, B=14:00-22:00, C=22:00-06:00 
- Week 2: B=06:00-14:00, C=14:00-22:00, A=22:00-06:00 
- Week 3: C=06:00-14:00, A=14:00-22:00, B=22:00-06:00 
- Week 4: Back to Week 1 pattern

Now each day will have 3 shift entries in the database, but with rotated time slots according to the weekly pattern!  