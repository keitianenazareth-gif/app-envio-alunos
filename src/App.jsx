import { useState, useEffect } from "react";
import { MessageCircle, Plus, Trash2, Check, Send, Search, Users, X } from "lucide-react";

const API_URL = "https://backend-alunos-production.up.railway.app";

export default function App() {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [sendQueue, setSendQueue] = useState(null);
  const [sentIds, setSentIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/alunos`);
      if (!res.ok) throw new Error("Falha ao carregar alunos");
      const data = await res.json();
      const mapped = data.map((s) => ({ id: String(s.id), name: s.nome, phone: s.telefone }));
      setStudents(mapped);
    } catch (e) {
      console.error(e);
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const addStudent = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    const cleanPhone = newPhone.replace(/\D/g, "");
    try {
      const res = await fetch(`${API_URL}/api/alunos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: newName.trim(), telefone: cleanPhone }),
      });
      if (!res.ok) throw new Error("Falha ao adicionar aluno");
      const created = await res.json();
      setStudents([...students, { id: String(created.id), name: created.nome, phone: created.telefone }]);
      setNewName("");
      setNewPhone("");
      setShowAdd(false);
    } catch (e) {
      console.error(e);
      setError("Não foi possível adicionar o aluno.");
    }
  };

  const removeStudent = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/alunos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover aluno");
      setStudents(students.filter((s) => s.id !== id));
      const newSel = new Set(selected);
      newSel.delete(id);
      setSelected(newSel);
    } catch (e) {
      console.error(e);
      setError("Não foi possível remover o aluno.");
    }
  };

  const toggleSelect = (id) => {
    const newSel = new Set(selected);
    if (newSel.has(id)) newSel.delete(id);
    else newSel.add(id);
    setSelected(newSel);
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAll = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const allSelected = filteredIds.every((id) => selected.has(id));
    const newSel = new Set(selected);
    if (allSelected) {
      filteredIds.forEach((id) => newSel.delete(id));
    } else {
      filteredIds.forEach((id) => newSel.add(id));
    }
    setSelected(newSel);
  };

  const startSending = () => {
    const list = students.filter((s) => selected.has(s.id));
    if (list.length === 0 || !message.trim()) return;
    setSentIds(new Set());
    setSendQueue({ list, idx: 0 });
  };

  const openWhatsAppFor = (student) => {
    const text = encodeURIComponent(message);
    const url = `https://wa.me/${student.phone}?text=${text}`;
    window.open(url, "_blank");
  };

  const markSentAndNext = () => {
    const current = sendQueue.list[sendQueue.idx];
    const newSent = new Set(sentIds);
    newSent.add(current.id);
    setSentIds(newSent);
    if (sendQueue.idx + 1 < sendQueue.list.length) {
      setSendQueue({ ...sendQueue, idx: sendQueue.idx + 1 });
    } else {
      setSendQueue(null);
    }
  };

  const skipCurrent = () => {
    if (sendQueue.idx + 1 < sendQueue.list.length) {
      setSendQueue({ ...sendQueue, idx: sendQueue.idx + 1 });
    } else {
      setSendQueue(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Carregando alunos...</p>
      </div>
    );
  }

  if (sendQueue) {
    const current = sendQueue.list[sendQueue.idx];
    const total = sendQueue.list.length;
    const doneCount = sentIds.size;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">
              {sendQueue.idx + 1} de {total}
            </span>
            <button onClick={() => setSendQueue(null)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(doneCount / total) * 100}%` }} />
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-semibold text-green-700">{current.name.charAt(0).toUpperCase()}</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-800">{current.name}</h2>
            <p className="text-sm text-slate-400">{current.phone}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6 text-sm text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {message}
          </div>

          <button
            onClick={() => openWhatsAppFor(current)}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl mb-3 transition-colors"
          >
            <MessageCircle size={18} />
            Abrir WhatsApp
          </button>

          <div className="flex gap-2">
            <button onClick={skipCurrent} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-medium hover:bg-slate-50 transition-colors">
              Pular
            </button>
            <button onClick={markSentAndNext} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors">
              <Check size={16} />
              Enviado, próximo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedCount = selected.size;

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
              <MessageCircle size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-semibold text-slate-800">Enviar para Alunos</h1>
          </div>
          <p className="text-sm text-slate-400">
            {students.length} aluno{students.length !== 1 ? "s" : ""} cadastrado{students.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400"><X size={16} /></button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <label className="text-sm font-medium text-slate-700 mb-2 block">Mensagem</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva a mensagem que será enviada..."
            className="w-full min-h-24 p-3 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aluno..."
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900 transition-colors">
            <Plus size={16} />
            Aluno
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-3 space-y-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do aluno"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Telefone com DDI e DDD (ex: 5527999998888)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button onClick={addStudent} className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
              Adicionar
            </button>
          </div>
        )}

        {filteredStudents.length > 0 && (
          <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-slate-500 mb-2 px-1 hover:text-slate-700">
            <Users size={14} />
            Selecionar todos os visíveis
          </button>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 mb-24">
          {filteredStudents.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              {students.length === 0 ? 'Nenhum aluno cadastrado ainda. Clique em "Aluno" para adicionar.' : "Nenhum aluno encontrado."}
            </div>
          )}
          {filteredStudents.map((s) => (
            <div key={s.id} onClick={() => toggleSelect(s.id)} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected.has(s.id) ? "bg-green-500 border-green-500" : "border-slate-300"
                }`}
              >
                {selected.has(s.id) && <Check size={14} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{s.name}</p>
                <p className="text-xs text-slate-400">{s.phone}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeStudent(s.id);
                }}
                className="text-slate-300 hover:text-red-400 p-1 flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={startSending}
              disabled={!message.trim()}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
            >
              <Send size={16} />
              Enviar para {selectedCount} aluno{selectedCount !== 1 ? "s" : ""}
            </button>
            {!message.trim() && <p className="text-xs text-center text-slate-400 mt-1.5">Escreva uma mensagem primeiro</p>}
          </div>
        </div>
      )}
    </div>
  );
}
