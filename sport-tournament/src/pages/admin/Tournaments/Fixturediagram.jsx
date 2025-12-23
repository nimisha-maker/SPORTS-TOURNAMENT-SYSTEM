import React, { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { Calendar, Clock, MapPin } from "lucide-react";

/**
 * props:
 * - event: { id, fixtures[], participants[] }
 * - mode: "roundrobin" | "knockout" | "custom"
 * - onUpdate(fixtures)  -> callback to update fixtures in parent
 */

export default function FixtureDiagram({
  event,
  mode,
  onUpdate,
  venues = [],
}) {
  const [fixtures, setFixtures] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setFixtures(event?.fixtures || []);
  }, [event]);

  // -----------------------------
  // DRAG & DROP (Custom Mode)
  // -----------------------------
  function handleDragEnd(result) {
    if (!result.destination) return;

    const items = Array.from(fixtures);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    setFixtures(items);
    onUpdate(items);
  }

  // -----------------------------
  // ROUND ROBIN UI
  // -----------------------------
  function renderRoundRobin() {
    const grouped = {};

    fixtures.forEach((f) => {
      const r = f.round || 1;
      if (!grouped[r]) grouped[r] = [];
      grouped[r].push(f);
    });

    return (
      <div className="space-y-8">
        {Object.keys(grouped).map((round) => (
          <div key={round} className="bg-white border rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-blue-700">
              Round {round}
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {grouped[round].map((f, idx) => (
                <FixtureCard key={f.id} fixture={f} onClick={() => setSelected(f)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // -----------------------------
  // KNOCKOUT BRACKET UI
  // -----------------------------
  function renderKnockout() {
    const rounds = {};

    fixtures.forEach((f) => {
      const r = f.round || 1;
      if (!rounds[r]) rounds[r] = [];
      rounds[r].push(f);
    });

    const roundKeys = Object.keys(rounds).sort((a, b) => Number(a) - Number(b));

    return (
      <div className="flex overflow-x-auto gap-10 pb-4">
        {roundKeys.map((r) => (
          <div key={r} className="min-w-[260px]">
            <h3 className="text-center font-semibold text-blue-700 mb-3">
              Round {r}
            </h3>

            <div className="space-y-4">
              {rounds[r].map((f) => (
                <BracketCard key={f.id} fixture={f} onClick={() => setSelected(f)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // -----------------------------
  // CUSTOM — ADMIN MANUAL SCHEDULING
  // -----------------------------
  function renderCustom() {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="custom-fixtures">
          {(provided) => (
            <div
              className="space-y-4"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {fixtures.map((f, idx) => (
                <Draggable key={f.id} draggableId={`${f.id}`} index={idx}>
                  {(drag) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      {...drag.dragHandleProps}
                    >
                      <FixtureCard
                        fixture={f}
                        onClick={() => setSelected(f)}
                        drag
                      />
                    </div>
                  )}
                </Draggable>
              ))}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-slate-800 mb-4">
        Fixtures - {event.label || event.sportName}
      </h2>

      {mode === "roundrobin" && renderRoundRobin()}
      {mode === "knockout" && renderKnockout()}
      {mode === "custom" && renderCustom()}

      {/* MATCH DETAIL MODAL */}
      {selected && (
        <FixtureDetailModal
          fixture={selected}
          venues={venues}
          onClose={() => setSelected(null)}
          onSave={(u) => {
            const updated = fixtures.map((f) =>
              f.id === selected.id ? { ...f, ...u } : f
            );
            setFixtures(updated);
            onUpdate(updated);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// CARD FOR ROUND ROBIN OR CUSTOM
// --------------------------------------------------------------------------
function FixtureCard({ fixture, onClick, drag }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 bg-white border hover:border-blue-500 cursor-pointer rounded-xl shadow-sm transition-all ${
        drag ? "active:scale-[0.98]" : ""
      }`}
    >
      <div className="font-semibold text-slate-800">
        {fixture.teamA?.name || "Team A"} vs {fixture.teamB?.name || "Team B"}
      </div>
      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
        <Calendar className="w-3 h-3" />
        {fixture.scheduledAt
          ? new Date(fixture.scheduledAt).toLocaleString()
          : "Not Scheduled"}
      </div>
      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
        <MapPin className="w-3 h-3" />
        {fixture.court || "Court ?"}
      </div>

      {fixture.score && (
        <div className="mt-2 text-blue-700 font-bold text-lg">
          {fixture.score.a} - {fixture.score.b}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// KNOCKOUT BRACKET CARD
// --------------------------------------------------------------------------
function BracketCard({ fixture, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-xl p-4 shadow-sm cursor-pointer hover:border-blue-500 transition-all"
    >
      <div className="font-medium text-slate-800">
        {fixture.teamA?.name || "TBD"}
      </div>
      <div className="text-center my-2 font-bold text-blue-700">
        {fixture.score ? `${fixture.score.a} - ${fixture.score.b}` : "VS"}
      </div>
      <div className="font-medium text-slate-800 text-right">
        {fixture.teamB?.name || "TBD"}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// FIXTURE DETAIL POPUP (DATE, TIME, VENUE, SCORES)
// --------------------------------------------------------------------------
function FixtureDetailModal({ fixture, venues, onClose, onSave }) {
  const [court, setCourt] = useState(fixture.court || "");
  const [scheduledAt, setScheduledAt] = useState(
    fixture.scheduledAt
      ? fixture.scheduledAt.substring(0, 16)
      : ""
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[420px] p-6 shadow-xl">
        <h3 className="text-lg font-bold mb-3 text-blue-700">
          Match Details
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Schedule</label>
            <input
              type="datetime-local"
              className="border p-2 rounded w-full"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Court / Venue</label>
            <select
              className="border p-2 rounded w-full"
              value={court}
              onChange={(e) => setCourt(e.target.value)}
            >
              <option value="">Select Venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ scheduledAt, court })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
