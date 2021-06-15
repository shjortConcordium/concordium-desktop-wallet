use std::collections::BTreeMap;
use id::types::*;
use crypto_common::{types::KeyIndex};
use std::convert::TryInto;
use keygen_bls::keygen_bls;
use serde_json::{from_value, Value as SerdeValue};
use ::failure::Fallible;
use pairing::bls12_381::Fr;
use dodis_yampolskiy_prf::secret as prf;
use curve_arithmetic::Curve;
use pedersen_scheme::{
    randomness::Randomness as PedersenRandomness, value::Value,
};

pub fn build_key_map(keys: &Vec<VerifyKey>) -> BTreeMap<KeyIndex, VerifyKey> {
    keys.iter().enumerate().map(|(index, key)| (KeyIndex(index.try_into().unwrap()), key.clone())).collect()
}

/// Try to extract a field with a given name from the JSON value.
pub fn try_get<A: serde::de::DeserializeOwned>(v: &SerdeValue, fname: &str) -> Fallible<A> {
    match v.get(fname) {
        Some(v) => Ok(from_value(v.clone())?),
        None => Err(format_err!("Field {} not present, but should be.", fname)),
    }
}

pub fn generate_bls_key(seed: &str) -> Fallible<Fr> {
    let key_info = b"";

    match keygen_bls(seed.as_bytes(), key_info) {
        Ok(s) => Ok(s),
        Err(_) => Err(format_err!("unable to build parse seed for bls_keygen.")),
    }
}

pub fn generate_cred_id<C: Curve>(prf_key: &prf::SecretKey<C>, cred_counter: u8, global_context: &GlobalContext<C>) -> Fallible<C> {
    let cred_id_exponent = match prf_key.prf_exponent(cred_counter) {
        Ok(exp) => exp,
        Err(_) => bail!(
            "Cannot create CDI with this account number because K + {} = 0.",
            cred_counter
        ),
    };

    Ok(global_context
       .on_chain_commitment_key
       .hide(
           &Value::<C>::new(cred_id_exponent),
           &PedersenRandomness::zero(),
       )
       .0)
}
