import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const buildValidationSchema = (schemaDef, t) => {
    let shape = {};
    if (!schemaDef || !Array.isArray(schemaDef)) return yup.object().shape({});

    schemaDef.forEach(field => {
        let validator;
        switch (field.type) {
            case 'email':
                validator = yup.string().email('Please enter a valid email address');
                break;
            case 'number':
                validator = yup.number().typeError('This field must be a valid number');
                break;
            case 'date':
                validator = yup.date().typeError('Please select a valid date');
                break;
            case 'checkbox':
                validator = yup.boolean();
                break;
            default:
                validator = yup.string();
        }

        if (field.required) {
            if (field.type === 'checkbox') {
                validator = validator.oneOf([true], 'You must accept this to continue');
            } else {
                validator = validator.required(t ? t('FieldRequired') : 'This field is required');
            }
        }

        if (field.minLength) validator = validator.min(field.minLength, `Minimum ${field.minLength} characters required`);
        if (field.maxLength) validator = validator.max(field.maxLength, `Maximum ${field.maxLength} characters allowed`);

        shape[field.name] = validator;
    });

    return yup.object().shape(shape);
};

export default function FormRenderer({ schema = [], onSubmit, onBack, defaultValues = {} }) {
    const { t } = useTranslation();

    const validationSchema = buildValidationSchema(schema, t);
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues
    });

    const renderField = (field, hasError) => {
        const baseClass = `w-full mt-2 rounded-2xl border-2 bg-slate-50/50 px-5 py-4 text-slate-800 text-lg transition-all duration-300 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/20 hover:border-slate-300'}`;

        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        {...register(field.name)}
                        className={`${baseClass} min-h-[140px] resize-y`}
                        placeholder={field.placeholder ? t(field.placeholder) : t(`Enter ${field.label.toLowerCase()}`)}
                    />
                );
            case 'select':
                return (
                    <select
                        {...register(field.name)}
                        className={baseClass}
                    >
                        <option value="" disabled>{t('SelectOption')}...</option>
                        {field.options?.map(opt => (
                            <option key={opt.value || opt} value={opt.value || opt}>{t(opt.label || opt)}</option>
                        ))}
                    </select>
                );
            case 'checkbox':
                return (
                    <div className="flex items-start gap-4 mt-4 p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer group">
                        <div className="flex items-center h-6 mt-0.5">
                            <input
                                type="checkbox"
                                id={field.name}
                                {...register(field.name)}
                                className="w-6 h-6 rounded border-slate-300 text-primary-600 focus:ring-primary-500 focus:ring-4 cursor-pointer"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor={field.name} className="text-base font-bold text-slate-800 cursor-pointer select-none">
                                {t(field.label)} {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {field.description && (
                                <p className="text-sm text-slate-500 mt-1 select-none">{t(field.description)}</p>
                            )}
                        </div>
                    </div>
                );
            default:
                return (
                    <input
                        type={field.type || 'text'}
                        {...register(field.name)}
                        className={baseClass}
                        placeholder={field.placeholder ? t(field.placeholder) : t(`Enter ${field.label.toLowerCase()}`)}
                    />
                );
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in slide-in-from-right-8 duration-500">

            <div className="bg-primary-50/50 border border-primary-100/50 rounded-2xl p-4 flex items-start gap-4 mb-8">
                <InformationCircleIcon className="w-6 h-6 text-primary-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-primary-800">
                    {t('FormMandatoryDetails')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                {schema.map(field => {
                    const hasError = !!errors[field.name];
                    return (
                        <div key={field.name} className={field.type === 'textarea' || field.type === 'checkbox' ? 'md:col-span-2' : ''}>
                            {field.type !== 'checkbox' && (
                                <div className="flex justify-between items-baseline mb-1">
                                    <label className="block text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                                        {t(field.label)} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {field.description && <span className="text-xs text-slate-400 font-medium">{t(field.description)}</span>}
                                </div>
                            )}

                            {renderField(field, hasError)}

                            {hasError && (
                                <div className="flex items-center gap-1.5 text-red-500 mt-2 animate-in slide-in-from-top-1">
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <p className="text-sm font-bold">{errors[field.name]?.message}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between items-center sm:gap-4 pt-10 mt-8 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onBack}
                    className="w-full sm:w-auto mt-4 sm:mt-0 px-8 py-4 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all focus-ring"
                >
                    {t('CancelApplication')}
                </button>
                <button
                    type="submit"
                    className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white font-extrabold text-lg rounded-xl shadow-xl shadow-slate-200 hover:bg-primary-600 hover:shadow-primary-500/30 hover:-translate-y-1 transition-all duration-300 focus-ring flex items-center justify-center gap-2 group"
                >
                    {t('SaveAndContinue')}
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
            </div>
        </form>
    );
}
